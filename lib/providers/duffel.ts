// Live flight data from the Duffel API (https://duffel.com/docs/api).
import type { BookingRequest } from "../booking";
import { transitCodes } from "../countries";

const API = "https://api.duffel.com";

export class ProviderError extends Error {
  constructor(
    message: string,
    public status = 502,
  ) {
    super(message);
  }
}

function token(): string {
  const t = process.env.DUFFEL_ACCESS_TOKEN;
  if (!t) throw new ProviderError("Flight search is not configured yet (missing DUFFEL_ACCESS_TOKEN).", 503);
  return t;
}

async function duffel<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token()}`,
      "Duffel-Version": "v2",
      Accept: "application/json",
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.errors?.[0]?.message || `Flight provider error (${res.status})`;
    console.error("Duffel error", res.status, JSON.stringify(json?.errors ?? json));
    throw new ProviderError(msg, res.status >= 500 ? 502 : 400);
  }
  return json as T;
}

export type Place = { code: string; label: string; type: "airport" | "city" };

type DuffelPlace = {
  type: "airport" | "city";
  iata_code: string | null;
  name: string;
  city_name?: string | null;
  iata_country_code?: string;
};

export async function searchPlaces(query: string): Promise<Place[]> {
  const { data } = await duffel<{ data: DuffelPlace[] }>(`/places/suggestions?query=${encodeURIComponent(query)}`);
  return data
    .filter((p) => p.iata_code)
    .slice(0, 10)
    .map((p) => ({
      code: p.iata_code!,
      type: p.type,
      label:
        p.type === "city"
          ? `${p.name} (${p.iata_code}) - All airports`
          : `${p.city_name || p.name} (${p.iata_code}) - ${p.name}`,
    }));
}

type DuffelAirport = { iata_code: string; name: string; city_name: string | null; iata_country_code: string };
type DuffelSegment = {
  departing_at: string;
  arriving_at: string;
  duration: string | null;
  origin: DuffelAirport;
  destination: DuffelAirport;
  marketing_carrier: { name: string; iata_code: string };
  marketing_carrier_flight_number: string;
  operating_carrier: { name: string };
};
type DuffelOffer = {
  id: string;
  total_amount: string;
  total_currency: string;
  expires_at: string;
  owner: { name: string; iata_code: string; logo_symbol_url: string | null };
  slices: { duration: string | null; origin: DuffelAirport; destination: DuffelAirport; segments: DuffelSegment[] }[];
};

export type FlightSegment = {
  from: string;
  fromName: string;
  to: string;
  toName: string;
  departAt: string;
  arriveAt: string;
  flightNumber: string;
  carrier: string;
  operatedBy: string;
};

export type FlightOffer = {
  id: string;
  airline: string;
  airlineCode: string;
  logo: string | null;
  price: string;
  currency: string;
  expiresAt: string;
  slices: { from: string; to: string; duration: string | null; stops: string[]; segments: FlightSegment[] }[];
};

function mapOffer(o: DuffelOffer): FlightOffer {
  return {
    id: o.id,
    airline: o.owner.name,
    airlineCode: o.owner.iata_code,
    logo: o.owner.logo_symbol_url,
    price: o.total_amount,
    currency: o.total_currency,
    expiresAt: o.expires_at,
    slices: o.slices.map((s) => ({
      from: s.origin.iata_code,
      to: s.destination.iata_code,
      duration: s.duration,
      stops: s.segments.slice(0, -1).map((seg) => seg.destination.iata_code),
      segments: s.segments.map((seg) => ({
        from: seg.origin.iata_code,
        fromName: seg.origin.name,
        to: seg.destination.iata_code,
        toName: seg.destination.name,
        departAt: seg.departing_at,
        arriveAt: seg.arriving_at,
        flightNumber: `${seg.marketing_carrier.iata_code}${seg.marketing_carrier_flight_number}`,
        carrier: seg.marketing_carrier.name,
        operatedBy: seg.operating_carrier.name,
      })),
    })),
  };
}

export async function searchFlights(b: BookingRequest): Promise<FlightOffer[]> {
  const legs = b.legs!;
  const slices = legs.map((l) => ({ origin: l.fromCode, destination: l.toCode, departure_date: l.date }));
  if (b.tripType === "roundtrip") {
    slices.push({ origin: legs[0].toCode, destination: legs[0].fromCode, departure_date: b.returnDate! });
  }

  const { data } = await duffel<{ data: { offers: DuffelOffer[] } }>(
    "/air/offer_requests?return_offers=true&supplier_timeout=20000",
    {
      method: "POST",
      body: JSON.stringify({
        data: {
          slices,
          passengers: Array.from({ length: b.travelers }, () => ({ type: "adult" })),
          cabin_class: b.cabin === "business" ? "business" : "economy",
          max_connections: 2,
        },
      }),
    },
  );

  // Drop offers that connect through a country the customer wants to avoid.
  const avoid = transitCodes(b.excludeTransit ?? []);
  const offers = data.offers.filter((o) =>
    o.slices.every((s) => s.segments.slice(0, -1).every((seg) => !avoid.has(seg.destination.iata_country_code))),
  );

  return offers
    .sort((a, z) => Number(a.total_amount) - Number(z.total_amount))
    .slice(0, 50)
    .map(mapOffer);
}

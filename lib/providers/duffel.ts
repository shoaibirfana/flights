// Duffel (https://duffel.com/docs/api): flight search limited to offers that can be held, and hold
// orders — a real airline booking with a booking reference (PNR), paid later or left to expire.
// Test tokens (duffel_test_) use Duffel's test airline and never charge anything.
import type { BookingRequest, Traveler } from "../booking";
import { transitCodes } from "../countries";
import type { FlightOffer, FlightSegment } from "./liteapi-flights";
import { ProviderError } from "./liteapi";

const API = process.env.DUFFEL_API_URL || "https://api.duffel.com";

export const duffelEnabled = () => Boolean(process.env.DUFFEL_ACCESS_TOKEN?.trim());

async function duffel<T>(path: string, init?: RequestInit): Promise<T> {
  const token = process.env.DUFFEL_ACCESS_TOKEN?.trim();
  if (!token) throw new ProviderError("Flight booking is not configured (missing DUFFEL_ACCESS_TOKEN).", 503);
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Duffel-Version": "v2",
      Accept: "application/json",
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error(`Duffel ${path} error`, res.status, JSON.stringify(json?.errors ?? json).slice(0, 1000));
    throw new ProviderError(json?.errors?.[0]?.message || `Flight provider error (${res.status})`, res.status >= 500 ? 502 : 400);
  }
  return json as T;
}

type DAirport = { iata_code: string; name: string; iata_country_code?: string };
type DSegment = {
  departing_at: string;
  arriving_at: string;
  duration: string | null;
  origin: DAirport;
  destination: DAirport;
  marketing_carrier: { name: string; iata_code: string };
  marketing_carrier_flight_number: string;
  operating_carrier: { name: string };
};
type DOffer = {
  id: string;
  total_amount: string;
  total_currency: string;
  expires_at: string;
  owner: { name: string; iata_code: string; logo_symbol_url: string | null };
  passengers: { id: string }[];
  payment_requirements?: { requires_instant_payment?: boolean; payment_required_by?: string | null };
  slices: { duration: string | null; segments: DSegment[] }[];
};

// ISO 8601 duration (PT13H25M / P1DT2H) → "13h 25m"
function formatDuration(d: string | null): string {
  const m = d?.match(/P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?/);
  if (!m) return "";
  const h = Number(m[1] || 0) * 24 + Number(m[2] || 0);
  return `${h}h ${Number(m[3] || 0)}m`;
}

function mapSegment(s: DSegment): FlightSegment {
  return {
    from: s.origin.iata_code,
    fromName: s.origin.name,
    to: s.destination.iata_code,
    toName: s.destination.name,
    departAt: s.departing_at,
    arriveAt: s.arriving_at,
    flightNumber: `${s.marketing_carrier.iata_code}${s.marketing_carrier_flight_number}`,
    carrier: s.marketing_carrier.name,
    operatedBy: s.operating_carrier.name,
  };
}

export async function searchHoldableFlights(b: BookingRequest): Promise<FlightOffer[]> {
  const legs = b.legs!;
  const slices = legs.map((l) => ({ origin: l.fromCode, destination: l.toCode, departure_date: l.date }));
  if (b.tripType === "roundtrip") {
    slices.push({ origin: legs[0].toCode, destination: legs[0].fromCode, departure_date: b.returnDate! });
  }
  const { data } = await duffel<{ data: { offers: DOffer[] } }>(
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

  const avoid = transitCodes(b.excludeTransit ?? []);
  return data.offers
    // Only offers the airline lets us hold without paying now
    .filter((o) => o.payment_requirements?.requires_instant_payment === false)
    .filter((o) =>
      o.slices.every((s) => s.segments.slice(0, -1).every((g) => !avoid.has(g.destination.iata_country_code ?? ""))),
    )
    .map((o): FlightOffer => {
      const mapped = o.slices.map((s) => s.segments.map(mapSegment));
      return {
        id: o.id,
        airline: o.owner.name,
        airlineCode: o.owner.iata_code,
        logo: o.owner.logo_symbol_url,
        price: Number(o.total_amount),
        currency: o.total_currency,
        expiresAt: o.expires_at,
        maxStops: Math.max(...mapped.map((segs) => segs.length - 1)),
        provider: "duffel",
        passengerIds: o.passengers.map((p) => p.id),
        slices: o.slices.map((s, i) => ({
          from: mapped[i][0].from,
          to: mapped[i][mapped[i].length - 1].to,
          duration: formatDuration(s.duration),
          stops: mapped[i].slice(0, -1).map((g) => g.to),
          segments: mapped[i],
        })),
      };
    })
    .sort((a, z) => a.maxStops - z.maxStops || a.price - z.price)
    .slice(0, 100);
}

type DPlace = {
  type: "airport" | "city";
  iata_code: string;
  name: string;
  city_name?: string | null;
  iata_country_code?: string;
  airports?: { iata_code: string; name: string }[] | null;
};

const countryNames = new Intl.DisplayNames(["en"], { type: "region" });
const countryName = (cc?: string) => {
  try {
    return cc ? (countryNames.of(cc) ?? cc) : "";
  } catch {
    return cc ?? "";
  }
};

// Airport autocomplete from Duffel's place suggestions, labelled like the LiteAPI search:
// "Lahore (LHE) - Allama Iqbal International Airport, Pakistan".
export async function searchDuffelAirports(query: string): Promise<{ code: string; label: string }[]> {
  const { data } = await duffel<{ data: DPlace[] }>(`/places/suggestions?query=${encodeURIComponent(query)}`);
  const seen = new Set<string>();
  const places: { code: string; label: string }[] = [];
  const add = (code: string, label: string) => {
    if (!/^[A-Z]{3}$/.test(code) || seen.has(code)) return;
    seen.add(code);
    places.push({ code, label });
  };
  for (const p of data) {
    const country = countryName(p.iata_country_code);
    const suffix = country ? `, ${country}` : "";
    if (p.type === "airport") {
      add(p.iata_code, p.city_name ? `${p.city_name} (${p.iata_code}) - ${p.name}${suffix}` : `${p.name} (${p.iata_code})${suffix}`);
    } else {
      // A city lists its airports; show each one so the customer picks the exact airport.
      for (const a of p.airports ?? []) add(a.iata_code, `${p.name} (${a.iata_code}) - ${a.name}${suffix}`);
    }
  }
  return places.slice(0, 10);
}

export type HoldTraveler = Traveler & { bornOn: string; gender: "m" | "f" };

export type HoldResult = { orderId: string; bookingReference: string; paymentRequiredBy: string | null };

const TITLES: Record<string, string> = { Mr: "mr", Mrs: "mrs", Ms: "ms", Miss: "miss", Master: "mr" };

// Reserves the selected offer as a hold order (no payment to the airline now).
export async function createHoldOrder(opts: {
  offerId: string;
  passengerIds: string[];
  travelers: HoldTraveler[];
  email: string;
  phone: string;
}): Promise<HoldResult> {
  const phone = "+" + opts.phone.replace(/\D/g, "");
  const { data } = await duffel<{
    data: { id: string; booking_reference: string; payment_status?: { payment_required_by?: string | null } };
  }>("/air/orders", {
    method: "POST",
    body: JSON.stringify({
      data: {
        type: "hold",
        selected_offers: [opts.offerId],
        passengers: opts.travelers.map((t, i) => ({
          id: opts.passengerIds[i],
          title: TITLES[t.title] ?? "mr",
          gender: t.gender,
          given_name: t.firstName,
          family_name: t.lastName,
          born_on: t.bornOn,
          email: opts.email,
          phone_number: phone,
        })),
      },
    }),
  });
  return {
    orderId: data.id,
    bookingReference: data.booking_reference,
    paymentRequiredBy: data.payment_status?.payment_required_by ?? null,
  };
}

// ---- Full booking details (GET /air/orders/:id) ----

type DCarrier = { name: string; iata_code: string; logo_symbol_url: string | null; logo_lockup_url: string | null };
type DPlacePoint = { iata_code: string; name: string; city_name: string | null };
type DOrder = {
  id: string;
  booking_reference: string;
  cancelled_at: string | null;
  owner: DCarrier;
  passengers: { id: string; title: string; given_name: string; family_name: string }[];
  payment_status: { awaiting_payment: boolean; payment_required_by: string | null };
  documents: { type: string; unique_identifier: string }[];
  slices: {
    duration: string | null;
    origin: DPlacePoint;
    destination: DPlacePoint;
    segments: {
      departing_at: string;
      arriving_at: string;
      duration: string | null;
      origin: DPlacePoint;
      destination: DPlacePoint;
      marketing_carrier: DCarrier;
      marketing_carrier_flight_number: string;
      operating_carrier: DCarrier;
      aircraft: { name: string } | null;
      passengers: { cabin_class: string; cabin_class_marketing_name: string | null }[];
    }[];
  }[];
};

const airport = (p: DPlacePoint) => ({ code: p.iata_code, name: p.name, city: p.city_name });

// Minutes between two local times at the same airport (arrival of one flight, departure of the next).
const minutesBetween = (a: string, b: string) => Math.round((Date.parse(b + "Z") - Date.parse(a + "Z")) / 60000);
const hm = (min: number) => `${Math.floor(min / 60)}h ${min % 60}m`;

export async function getOrderDetails(orderId: string) {
  const { data: o } = await duffel<{ data: DOrder }>(`/air/orders/${encodeURIComponent(orderId)}`);

  // The real state of the booking: a hold is never "Confirmed" until it's paid and ticketed.
  const status = o.cancelled_at
    ? "Cancelled"
    : o.payment_status.awaiting_payment
      ? "On hold (awaiting payment)"
      : o.documents.some((d) => d.type === "electronic_ticket")
        ? "Ticketed"
        : "Paid";

  const slices = o.slices.map((s) => ({
    from: airport(s.origin),
    to: airport(s.destination),
    date: s.segments[0].departing_at.slice(0, 10),
    duration: formatDuration(s.duration),
    flights: s.segments.map((g, i) => ({
      airline: g.marketing_carrier.name,
      airlineCode: g.marketing_carrier.iata_code,
      logoSymbol: g.marketing_carrier.logo_symbol_url,
      logoLockup: g.marketing_carrier.logo_lockup_url,
      operatedBy: g.operating_carrier.name,
      flightNumber: `${g.marketing_carrier.iata_code}${g.marketing_carrier_flight_number}`,
      from: airport(g.origin),
      to: airport(g.destination),
      departDate: g.departing_at.slice(0, 10),
      departTime: g.departing_at.slice(11, 16),
      arriveDate: g.arriving_at.slice(0, 10),
      arriveTime: g.arriving_at.slice(11, 16),
      duration: formatDuration(g.duration),
      cabinClass: g.passengers[0]?.cabin_class_marketing_name || g.passengers[0]?.cabin_class || null,
      aircraft: g.aircraft?.name ?? null,
      // Wait at this airport before the next flight of the same journey
      connection:
        i < s.segments.length - 1
          ? { airport: airport(g.destination), wait: hm(minutesBetween(g.arriving_at, s.segments[i + 1].departing_at)) }
          : null,
    })),
  }));

  return {
    orderId: o.id,
    airlineBookingReference: o.booking_reference,
    status,
    payBy: o.payment_status.payment_required_by,
    airline: { name: o.owner.name, code: o.owner.iata_code, logoSymbol: o.owner.logo_symbol_url, logoLockup: o.owner.logo_lockup_url },
    passengers: o.passengers.map((p) => `${p.title.toUpperCase()} ${p.given_name} ${p.family_name}`.trim()),
    tripDate: slices[0]?.date ?? null,
    destination: slices[0]?.to ?? null,
    slices,
  };
}

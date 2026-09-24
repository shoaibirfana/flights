// Live flight search: POST /flights/rates.
// Response: data[] → journeys[] (segments[] + fare offers[]). One journey = one routing; we show
// its cheapest offer.
import type { BookingRequest } from "../booking";
import { transitCodes } from "../countries";
import { lite } from "./liteapi";
import { getAirports } from "./liteapi-airports";

type Duration = { iso8601?: string; minutes?: number };
type LiteSegment = {
  originCode?: string;
  originName?: string;
  destinationCode?: string;
  destinationName?: string;
  departureTime?: string;
  arrivalTime?: string;
  direction?: "OUTBOUND" | "INBOUND";
  duration?: Duration;
  flight?: { marketingNumber?: string };
  carrier?: { marketingCode?: string; marketingName?: string; marketingLogo?: string; operatingName?: string };
};
type LiteOffer = { offerId: string; expiration?: string; pricing?: { display?: { total?: number; currency?: string } } };
type LiteJourney = { journeyKey: string; segments?: LiteSegment[]; offers?: LiteOffer[] };

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

export type FlightSlice = { from: string; to: string; duration: string; stops: string[]; segments: FlightSegment[] };

export type FlightOffer = {
  id: string;
  airline: string;
  airlineCode: string;
  logo: string | null;
  price: number;
  currency: string;
  expiresAt: string | null;
  slices: FlightSlice[];
};

// Times are airport-local, so a trip's length = flying time of each segment + layovers
// (a layover's two times are at the same airport, so subtracting them is safe).
const minutesBetween = (a?: string, b?: string) => (a && b ? Math.round((Date.parse(b) - Date.parse(a)) / 60000) : NaN);

function segmentMinutes(d?: Duration): number {
  if (typeof d?.minutes === "number") return d.minutes;
  const m = d?.iso8601?.match(/P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?/);
  return m ? Number(m[1] || 0) * 1440 + Number(m[2] || 0) * 60 + Number(m[3] || 0) : NaN;
}

function sliceDuration(segs: LiteSegment[]): string {
  let total = 0;
  segs.forEach((s, i) => {
    total += segmentMinutes(s.duration);
    if (i > 0) total += minutesBetween(segs[i - 1].arrivalTime, s.departureTime);
  });
  return Number.isFinite(total) && total > 0 ? `${Math.floor(total / 60)}h ${total % 60}m` : "";
}

function mapSegment(s: LiteSegment): FlightSegment {
  const code = s.carrier?.marketingCode ?? "";
  const num = s.flight?.marketingNumber ?? "";
  return {
    from: s.originCode ?? "",
    fromName: s.originName ?? s.originCode ?? "",
    to: s.destinationCode ?? "",
    toName: s.destinationName ?? s.destinationCode ?? "",
    departAt: s.departureTime ?? "",
    arriveAt: s.arrivalTime ?? "",
    flightNumber: num.startsWith(code) ? num : `${code}${num}`,
    carrier: s.carrier?.marketingName ?? code,
    operatedBy: s.carrier?.operatingName ?? s.carrier?.marketingName ?? code,
  };
}

// Split a journey's segments into one slice per requested leg: walk the segments and close a slice
// when it reaches the leg's destination. Round trips also carry an OUTBOUND/INBOUND tag.
function splitSlices(segs: LiteSegment[], legs: { destination: string }[]): LiteSegment[][] {
  if (legs.length === 2 && segs.some((s) => s.direction === "INBOUND")) {
    return [segs.filter((s) => s.direction !== "INBOUND"), segs.filter((s) => s.direction === "INBOUND")];
  }
  const slices: LiteSegment[][] = [];
  let current: LiteSegment[] = [];
  for (const s of segs) {
    current.push(s);
    const leg = legs[slices.length];
    if (leg && s.destinationCode === leg.destination && slices.length < legs.length - 1) {
      slices.push(current);
      current = [];
    }
  }
  if (current.length) slices.push(current);
  return slices;
}

export async function searchFlights(b: BookingRequest): Promise<FlightOffer[]> {
  const legs = b.legs!.map((l) => ({ origin: l.fromCode, destination: l.toCode, date: l.date }));
  if (b.tripType === "roundtrip") {
    legs.push({ origin: legs[0].destination, destination: legs[0].origin, date: b.returnDate! });
  }
  const directed =
    b.tripType === "roundtrip"
      ? [{ ...legs[0], direction: "OUTBOUND" }, { ...legs[1], direction: "INBOUND" }]
      : legs;

  const { data = [] } = await lite<{ data?: { journeys?: LiteJourney[] }[] }>("/flights/rates", {
    method: "POST",
    body: JSON.stringify({
      legs: directed,
      adults: b.travelers,
      cabinClass: b.cabin === "business" ? "BUSINESS" : "ECONOMY",
      currency: "USD",
      filters: { maxStops: 2 },
    }),
  });

  // Countries the customer wants to avoid transiting (looked up from the airport list).
  const avoid = transitCodes(b.excludeTransit ?? []);
  const airportCountry = avoid.size ? (await getAirports()).byCode : null;

  const offers: FlightOffer[] = [];
  for (const journey of data.flatMap((d) => d.journeys ?? [])) {
    const segs = journey.segments ?? [];
    if (segs.length === 0) continue;

    // Cheapest priced fare for this routing; never show an offer without a price.
    let best: { offer: LiteOffer; total: number; currency: string } | null = null;
    for (const o of journey.offers ?? []) {
      const total = o.pricing?.display?.total;
      const currency = o.pricing?.display?.currency;
      if (typeof total === "number" && currency && (!best || total < best.total)) best = { offer: o, total, currency };
    }
    if (!best) continue;

    const slices = splitSlices(segs, legs);
    if (airportCountry) {
      const connections = slices.flatMap((sl) => sl.slice(0, -1).map((s) => s.destinationCode ?? ""));
      if (connections.some((c) => avoid.has(airportCountry.get(c)?.countryCode ?? ""))) continue;
    }

    const first = segs[0];
    offers.push({
      id: best.offer.offerId,
      airline: first.carrier?.marketingName ?? first.carrier?.marketingCode ?? "Airline",
      airlineCode: first.carrier?.marketingCode ?? "",
      logo: first.carrier?.marketingLogo ?? null,
      price: best.total,
      currency: best.currency,
      expiresAt: best.offer.expiration ?? null,
      slices: slices.map((sl) => {
        const segments = sl.map(mapSegment);
        const start = segments[0];
        const end = segments[segments.length - 1];
        return {
          from: start.from,
          to: end.to,
          duration: sliceDuration(sl),
          stops: segments.slice(0, -1).map((s) => s.to),
          segments,
        };
      }),
    });
  }

  // Keep one offer per exact set of flights, cheapest first.
  const seen = new Set<string>();
  return offers
    .sort((a, z) => a.price - z.price)
    .filter((o) => {
      const k = o.slices.map((s) => s.segments.map((g) => g.flightNumber + g.departAt).join()).join("|");
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .slice(0, 50);
}

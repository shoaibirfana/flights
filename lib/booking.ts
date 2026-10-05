import { calculatePrice, type ServiceType, type TripType } from "./site";

// `from`/`to` are display labels; `fromCode`/`toCode` are IATA airport or city codes.
export type FlightLeg = { from: string; fromCode: string; to: string; toCode: string; date: string };

export type BookingRequest = {
  service: ServiceType;
  travelers: number;
  // flight
  tripType?: TripType;
  legs?: FlightLeg[];
  returnDate?: string;
  cabin?: "economy" | "business";
  excludeTransit?: string[];
};

export type Traveler = {
  firstName: string;
  lastName: string;
  // Older orders only; the form no longer asks for these
  title?: string;
  nationality?: string;
  // Required by airlines for a real booking (Duffel hold orders)
  bornOn?: string;
  gender?: "m" | "f";
};

// One leg of a flight (a takeoff + landing at two airports).
export type FlightSegment = {
  flightNumber: string;   // "QR629"
  airline: string;        // "Qatar Airways"
  from: string;           // "LHE"
  fromName: string;       // "Allama Iqbal International Airport"
  to: string;             // "DOH"
  toName: string;         // "Hamad International Airport"
  departAt: string;       // "2026-10-16T09:55:00"
  arriveAt: string;       // "2026-10-16T11:50:00"
  operatedBy?: string;    // operating carrier name, if codeshare
  logo?: string | null;   // airline logo URL (from LiteAPI carrier.marketingLogo)
};

// What the customer picked from the live search results. `hold` is set for flights that can be
// reserved automatically as a Duffel hold order. `segments` carries the per-leg detail used on
// the printable trip summary.
export type Selection = {
  ref: string;
  // Full details (flight numbers, times) for the team's order email
  summary: string[];
  // Customer-facing lines without flight numbers or times
  display?: string[];
  segments?: FlightSegment[];
  hold?: { offerId: string; passengerIds: string[] };
};

export type Order = {
  booking: BookingRequest;
  selections: Selection[];
  travelers: Traveler[];
  contact: { email: string; phone: string; notes?: string };
};

export function encodeBooking(b: BookingRequest): string {
  return encodeURIComponent(JSON.stringify(b));
}

export function decodeBooking(raw: string | undefined | null): BookingRequest | null {
  if (!raw) return null;
  try {
    return validateBooking(JSON.parse(decodeURIComponent(raw)));
  } catch {
    return null;
  }
}

const str = (v: unknown, max = 120) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const isDate = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v);
const isIata = (v: string) => /^[A-Z]{3}$/.test(v);

// Validates and normalises untrusted booking input (from the URL or an API body).
export function validateBooking(input: unknown): BookingRequest | null {
  if (!input || typeof input !== "object") return null;
  const b = input as Record<string, unknown>;
  const travelers = Math.floor(Number(b.travelers));
  if (!(travelers >= 1 && travelers <= 9)) return null;

  if (b.service === "flight") {
    const tripType = b.tripType as TripType;
    if (!["oneway", "roundtrip", "multicity"].includes(tripType)) return null;
    const legs = Array.isArray(b.legs)
      ? b.legs.slice(0, 6).map((l: Record<string, unknown>) => ({
          from: str(l?.from),
          fromCode: str(l?.fromCode, 3).toUpperCase(),
          to: str(l?.to),
          toCode: str(l?.toCode, 3).toUpperCase(),
          date: str(l?.date, 10),
        }))
      : [];
    if (legs.length === 0 || legs.some((l) => !isIata(l.fromCode) || !isIata(l.toCode) || !isDate(l.date))) {
      return null;
    }
    if (tripType !== "multicity" && legs.length !== 1) return null;
    if (tripType === "multicity" && legs.length < 2) return null;
    const returnDate = str(b.returnDate, 10);
    if (tripType === "roundtrip" && (!isDate(returnDate) || returnDate < legs[0].date)) return null;
    return {
      service: "flight",
      travelers,
      tripType,
      legs,
      returnDate: tripType === "roundtrip" ? returnDate : undefined,
      cabin: b.cabin === "business" ? "business" : "economy",
      excludeTransit: Array.isArray(b.excludeTransit)
        ? b.excludeTransit.slice(0, 10).map((c) => str(c, 60)).filter(Boolean)
        : [],
    };
  }

  return null;
}

// Our service fee for this booking. TEST_ORDER_PRICE (e.g. "1") temporarily charges that flat amount for
// every order, for a real-money payment test; remove it afterwards. Server-side only.
export function bookingPrice(b: BookingRequest): number {
  const testPrice = Number(process.env.TEST_ORDER_PRICE);
  if (testPrice > 0) return testPrice;
  return calculatePrice({
    service: b.service,
    travelers: b.travelers,
    legs: b.tripType === "roundtrip" ? 2 : b.legs?.length,
  });
}

const tripLabels: Record<TripType, string> = {
  oneway: "One way",
  roundtrip: "Round trip",
  multicity: "Multi-city",
};

// Plain-text summary used on the order page and in emails.
export function describeBooking(b: BookingRequest): string[] {
  const lines: string[] = [];
  {
    lines.push(`Flight reservation (${tripLabels[b.tripType!]}, ${b.cabin === "business" ? "Business" : "Economy"})`);
    b.legs!.forEach((l, i) =>
      lines.push(`${b.legs!.length > 1 ? `Flight ${i + 1}: ` : ""}${l.fromCode} → ${l.toCode} on ${l.date}`),
    );
    if (b.tripType === "roundtrip") lines.push(`Return: ${b.legs![0].toCode} → ${b.legs![0].fromCode} on ${b.returnDate}`);
    if (b.excludeTransit?.length) lines.push(`Avoid transit via: ${b.excludeTransit.join(", ")}`);
  }
  lines.push(`Travelers: ${b.travelers}`);
  return lines;
}

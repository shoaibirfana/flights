import { calculatePrice, type ServiceType, type TripType } from "./site";

// `from`/`to` are display labels; `fromCode`/`toCode` are IATA airport or city codes.
export type FlightLeg = { from: string; fromCode: string; to: string; toCode: string; date: string };
export type HotelStay = { city: string; countryCode: string; checkIn: string; checkOut: string };

export type BookingRequest = {
  service: ServiceType;
  travelers: number;
  // flight
  tripType?: TripType;
  legs?: FlightLeg[];
  returnDate?: string;
  cabin?: "economy" | "business";
  excludeTransit?: string[];
  // hotel
  hotels?: HotelStay[];
};

export type Traveler = { title: string; firstName: string; lastName: string; nationality: string };

// What the customer picked from the live search results (for the team to reserve).
export type Selection = { ref: string; summary: string[] };

export type Order = {
  booking: BookingRequest;
  selections: Selection[];
  travelers: Traveler[];
  contact: { email: string; phone: string; notes: string };
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

  if (b.service === "hotel") {
    const hotels = Array.isArray(b.hotels)
      ? b.hotels.slice(0, 10).map((h: Record<string, unknown>) => ({
          city: str(h?.city),
          countryCode: str(h?.countryCode, 2).toUpperCase(),
          checkIn: str(h?.checkIn, 10),
          checkOut: str(h?.checkOut, 10),
        }))
      : [];
    if (
      hotels.length === 0 ||
      hotels.some(
        (h) =>
          !h.city || !/^[A-Z]{2}$/.test(h.countryCode) || !isDate(h.checkIn) || !isDate(h.checkOut) || h.checkOut <= h.checkIn,
      )
    )
      return null;
    return { service: "hotel", travelers, hotels };
  }
  return null;
}

// Our service fee for this booking.
export function bookingPrice(b: BookingRequest): number {
  return calculatePrice({
    service: b.service,
    travelers: b.travelers,
    legs: b.tripType === "roundtrip" ? 2 : b.legs?.length,
    cities: b.hotels?.length,
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
  if (b.service === "flight") {
    lines.push(`Flight reservation (${tripLabels[b.tripType!]}, ${b.cabin === "business" ? "Business" : "Economy"})`);
    b.legs!.forEach((l, i) =>
      lines.push(`${b.legs!.length > 1 ? `Flight ${i + 1}: ` : ""}${l.fromCode} → ${l.toCode} on ${l.date}`),
    );
    if (b.tripType === "roundtrip") lines.push(`Return: ${b.legs![0].toCode} → ${b.legs![0].fromCode} on ${b.returnDate}`);
    if (b.excludeTransit?.length) lines.push(`Avoid transit via: ${b.excludeTransit.join(", ")}`);
  } else {
    lines.push("Hotel reservation");
    b.hotels!.forEach((h) => lines.push(`${h.city}, ${h.countryCode}: ${h.checkIn} to ${h.checkOut}`));
  }
  lines.push(`Travelers: ${b.travelers}`);
  return lines;
}

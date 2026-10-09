// Everything the trip summary page needs to show one order, so the server can render that page
// as the PDF attached to the customer's email (see lib/trip-summary-pdf.ts).
import type { BookingRequest, FlightSegment, Order, Traveler } from "./booking";
import { randomAirlineReservationCode, randomReservationCode } from "./codes";

export type TripCodes = { reservation: string; airline: string };

export type Itinerary = {
  booking: BookingRequest;
  travelers: Pick<Traveler, "firstName" | "lastName">[];
  segments: FlightSegment[];
  codes: TripCodes;
};

// The codes the customer's browser already shows on the trip summary, or new ones in the same format.
export function tripCodes(input: unknown): TripCodes {
  const c = (input ?? {}) as Record<string, unknown>;
  const reservation = typeof c.reservation === "string" && /^[A-Z0-9]{6}$/.test(c.reservation) ? c.reservation : "";
  const airline = typeof c.airline === "string" && /^\d{13}[A-Z]\d$/.test(c.airline) ? c.airline : "";
  return {
    reservation: reservation || randomReservationCode(),
    airline: airline || randomAirlineReservationCode(),
  };
}

export function itineraryFor(order: Order, codes: TripCodes): Itinerary {
  return {
    booking: order.booking,
    travelers: order.travelers.map(({ firstName, lastName }) => ({ firstName, lastName })),
    segments: order.selections.flatMap((s) => s.segments ?? []),
    codes,
  };
}

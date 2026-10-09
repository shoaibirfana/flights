import { randomBytes } from "crypto";
import {
  bookingPrice,
  describeBooking,
  validateBooking,
  type FlightSegment,
  type Order,
  type Selection,
  type Traveler,
} from "./booking";
import { formatPrice, site } from "./site";

export function newOrderId(): string {
  const date = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  return `VB${date}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

const clean = (v: unknown, max = 100) => (typeof v === "string" ? v.trim().slice(0, max) : "");

// One flight of the selected itinerary, used for the trip summary PDF sent to the customer.
function cleanSegment(g: Record<string, unknown>): FlightSegment {
  const operatedBy = clean(g?.operatedBy, 100);
  const logo = clean(g?.logo, 300);
  return {
    flightNumber: clean(g?.flightNumber, 12),
    airline: clean(g?.airline, 100),
    from: clean(g?.from, 4),
    fromName: clean(g?.fromName, 120),
    to: clean(g?.to, 4),
    toName: clean(g?.toName, 120),
    departAt: clean(g?.departAt, 25),
    arriveAt: clean(g?.arriveAt, 25),
    ...(operatedBy ? { operatedBy } : {}),
    ...(/^https:\/\//.test(logo) ? { logo } : {}),
  };
}

export function validateOrder(input: unknown): { order: Order; total: number } | { error: string } {
  if (!input || typeof input !== "object") return { error: "Invalid request." };
  const body = input as Record<string, unknown>;
  const booking = validateBooking(body.booking);
  if (!booking) return { error: "Booking details are invalid. Please start again." };

  const rawSelections = Array.isArray(body.selections) ? body.selections : [];
  if (rawSelections.length !== 1) return { error: "Please select your flight first." };
  const selections: Selection[] = rawSelections.map((s: Record<string, unknown>) => {
    const h = s?.hold as Record<string, unknown> | undefined;
    const offerId = clean(h?.offerId, 80);
    const passengerIds = Array.isArray(h?.passengerIds) ? h.passengerIds.slice(0, 9).map((p) => clean(p, 80)) : [];
    return {
      ref: clean(s?.ref, 120),
      summary: Array.isArray(s?.summary) ? s.summary.slice(0, 20).map((l: unknown) => clean(l, 200)) : [],
      ...(Array.isArray(s?.display) ? { display: s.display.slice(0, 10).map((l: unknown) => clean(l, 200)) } : {}),
      ...(Array.isArray(s?.segments) ? { segments: s.segments.slice(0, 12).map(cleanSegment) } : {}),
      ...(/^off_[A-Za-z0-9]+$/.test(offerId) && passengerIds.length && passengerIds.every((p) => /^pas_[A-Za-z0-9]+$/.test(p))
        ? { hold: { offerId, passengerIds } }
        : {}),
    };
  });
  if (selections.some((s) => !s.ref)) return { error: "Please select your flight first." };

  const rawTravelers = Array.isArray(body.travelers) ? body.travelers : [];
  if (rawTravelers.length !== booking.travelers) return { error: "Please enter details for every traveler." };
  const travelers: Traveler[] = rawTravelers.map((t: Record<string, unknown>) => {
    const bornOn = clean(t?.bornOn, 10);
    const gender = t?.gender === "m" || t?.gender === "f" ? t.gender : undefined;
    return {
      firstName: clean(t?.firstName),
      lastName: clean(t?.lastName),
      ...(/^\d{4}-\d{2}-\d{2}$/.test(bornOn) ? { bornOn } : {}),
      ...(gender ? { gender } : {}),
    };
  });
  if (travelers.some((t) => !t.firstName || !t.lastName)) {
    return { error: "Please fill in the name of every traveler." };
  }
  const hold = selections.find((s) => s.hold)?.hold;
  if (hold) {
    if (hold.passengerIds.length !== travelers.length) return { error: "Please search again and reselect your flight." };
    if (travelers.some((t) => !t.bornOn || !t.gender)) {
      return { error: "Please enter the date of birth and gender for every traveler." };
    }
  }

  const c = (body.contact || {}) as Record<string, unknown>;
  const contact = { email: clean(c.email, 200), phone: clean(c.phone, 40) };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) return { error: "Please enter a valid email address." };
  // Only Duffel bookings need a phone number (the airline requires one)
  if (hold && contact.phone.replace(/\D/g, "").length < 7) return { error: "Please enter a valid phone number." };

  return { order: { booking, selections, travelers, contact }, total: bookingPrice(booking) };
}

// The section between this header and "Travelers:" is left out of the customer's email.
const TEAM_ONLY_HEADER = "Selected flight (team only, not sent to the customer):";

export function customerSummary(summary: string): string {
  const lines = summary.split("\n");
  const start = lines.indexOf(TEAM_ONLY_HEADER);
  if (start < 0) return summary;
  const end = lines.indexOf("Travelers:", start);
  return [...lines.slice(0, start), ...lines.slice(end < 0 ? lines.length : end)].join("\n");
}

export function orderSummaryText(orderId: string, order: Order, total: number): string {
  return [
    `Order ID: ${orderId}`,
    `Service fee: ${formatPrice(total)} ${site.currency}`,
    "",
    ...describeBooking(order.booking),
    "",
    ...order.selections.flatMap((s) => (s.display?.length ? ["Flight:", ...s.display.map((l) => `  ${l}`), ""] : [])),
    TEAM_ONLY_HEADER,
    ...order.selections.flatMap((s) => [...s.summary.map((l) => `  ${l}`), `  Ref: ${s.ref}`, ""]),
    "Travelers:",
    ...order.travelers.map(
      (t, i) =>
        `  ${i + 1}. ${t.firstName} ${t.lastName}${t.gender ? `, ${t.gender === "f" ? "female" : "male"}` : ""}${t.bornOn ? `, born ${t.bornOn}` : ""}`,
    ),
    "",
    `Email: ${order.contact.email}`,
    ...(order.contact.phone ? [`Phone: ${order.contact.phone}`] : []),
    ...(order.contact.notes ? [`Notes: ${order.contact.notes}`] : []),
  ].join("\n");
}

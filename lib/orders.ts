import { randomBytes } from "crypto";
import { bookingPrice, describeBooking, validateBooking, type Order, type Selection, type Traveler } from "./booking";
import { formatPrice, site } from "./site";

export function newOrderId(): string {
  const date = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  return `FV${date}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

const clean = (v: unknown, max = 100) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export function validateOrder(input: unknown): { order: Order; total: number } | { error: string } {
  if (!input || typeof input !== "object") return { error: "Invalid request." };
  const body = input as Record<string, unknown>;
  const booking = validateBooking(body.booking);
  if (!booking) return { error: "Booking details are invalid. Please start again." };

  const expected = booking.service === "hotel" ? booking.hotels!.length : 1;
  const rawSelections = Array.isArray(body.selections) ? body.selections : [];
  if (rawSelections.length !== expected) return { error: "Please select your flight or hotel first." };
  const selections: Selection[] = rawSelections.map((s: Record<string, unknown>) => ({
    ref: clean(s?.ref, 120),
    summary: Array.isArray(s?.summary) ? s.summary.slice(0, 20).map((l: unknown) => clean(l, 200)) : [],
  }));
  if (selections.some((s) => !s.ref)) return { error: "Please select your flight or hotel first." };

  const rawTravelers = Array.isArray(body.travelers) ? body.travelers : [];
  if (rawTravelers.length !== booking.travelers) return { error: "Please enter details for every traveler." };
  const travelers: Traveler[] = rawTravelers.map((t: Record<string, unknown>) => ({
    title: clean(t?.title, 10),
    firstName: clean(t?.firstName),
    lastName: clean(t?.lastName),
    nationality: clean(t?.nationality, 60),
  }));
  if (travelers.some((t) => !t.firstName || !t.lastName || !t.nationality)) {
    return { error: "Please fill in the name and nationality for every traveler." };
  }

  const c = (body.contact || {}) as Record<string, unknown>;
  const contact = { email: clean(c.email, 200), phone: clean(c.phone, 40), notes: clean(c.notes, 1000) };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) return { error: "Please enter a valid email address." };
  if (contact.phone.replace(/\D/g, "").length < 7) return { error: "Please enter a valid phone number." };

  return { order: { booking, selections, travelers, contact }, total: bookingPrice(booking) };
}

export function orderSummaryText(orderId: string, order: Order, total: number): string {
  return [
    `Order ID: ${orderId}`,
    `Service fee: ${formatPrice(total)} ${site.currency}`,
    "",
    ...describeBooking(order.booking),
    "",
    "Selected:",
    ...order.selections.flatMap((s) => [...s.summary.map((l) => `  ${l}`), `  Ref: ${s.ref}`, ""]),
    "Travelers:",
    ...order.travelers.map((t, i) => `  ${i + 1}. ${t.title} ${t.firstName} ${t.lastName} (${t.nationality})`),
    "",
    `Email: ${order.contact.email}`,
    `Phone: ${order.contact.phone}`,
    ...(order.contact.notes ? [`Notes: ${order.contact.notes}`] : []),
  ].join("\n");
}

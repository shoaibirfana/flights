import type { Order } from "./booking";
import { createHoldOrder, type HoldResult, type HoldTraveler } from "./providers/duffel";

// Everything needed to create a Duffel hold order later (e.g. after Stripe confirms payment).
export type HoldRequest = {
  offerId: string;
  passengerIds: string[];
  travelers: HoldTraveler[];
  email: string;
  phone: string;
};

export function holdRequestFor(order: Order): HoldRequest | null {
  const hold = order.selections.find((s) => s.hold)?.hold;
  if (!hold) return null;
  return {
    offerId: hold.offerId,
    passengerIds: hold.passengerIds,
    travelers: order.travelers.map((t) => ({ ...t, bornOn: t.bornOn!, gender: t.gender! })),
    email: order.contact.email,
    phone: order.contact.phone,
  };
}

export const placeHold = (r: HoldRequest): Promise<HoldResult> => createHoldOrder(r);

// Lines added to the top of the order summary once the hold exists (or failed).
export function holdSummary(result: HoldResult | null, error?: string): string {
  if (result) {
    return [
      `AIRLINE BOOKING REFERENCE (PNR): ${result.bookingReference}`,
      `Status: on hold${result.paymentRequiredBy ? ` until ${result.paymentRequiredBy}` : ""}`,
      `Duffel order: ${result.orderId}`,
      "",
    ].join("\n");
  }
  return `AUTOMATIC FLIGHT HOLD FAILED${error ? `: ${error}` : ""}. Please book this flight manually.\n\n`;
}

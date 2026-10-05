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

// With a live Duffel token every hold is a real airline booking that Duffel bills for, so live holds
// stay off until DUFFEL_LIVE_HOLDS=on (searches still use live data). Test tokens always hold.
export const duffelLive = () => Boolean(process.env.DUFFEL_ACCESS_TOKEN?.trim().startsWith("duffel_live_"));
export const holdsAllowed = () => !duffelLive() || process.env.DUFFEL_LIVE_HOLDS?.trim().toLowerCase() === "on";

export function holdRequestFor(order: Order): HoldRequest | null {
  if (!holdsAllowed()) return null;
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
      "We advise you to print this and take it with you to ensure your trip goes as smoothly as possible.",
      "This is a reservation only, not a paid ticket. It was created to secure your seat for your visa application.",
      "The airline cancels it automatically at the deadline above unless it is paid. To confirm and ticket this booking, contact us before then.",
      "",
    ].join("\n");
  }
  return `AUTOMATIC FLIGHT HOLD FAILED${error ? `: ${error}` : ""}. Please book this flight manually.\n\n`;
}

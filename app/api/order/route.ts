import { NextResponse } from "next/server";
import { encodeBooking } from "@/lib/booking";
import { holdRequestFor, holdSummary, placeHold } from "@/lib/hold";
import { itineraryFor, tripCodes } from "@/lib/itinerary";
import { sendOrderEmails } from "@/lib/notify";
import { newOrderId, orderSummaryText, validateOrder } from "@/lib/orders";
import { createCheckout, paymentsEnabled } from "@/lib/payments";
import { siteOrigin } from "@/lib/trip-summary-pdf";

// Rendering the trip summary PDF for the email takes a few seconds.
export const maxDuration = 60;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const result = validateOrder(body);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });

  const { order, total } = result;
  const orderId = newOrderId();
  const summary = orderSummaryText(orderId, order, total);
  const holdRequest = holdRequestFor(order);
  // Same codes as on the customer's trip summary page (sent by the order form), so the emailed PDF matches it.
  const codes = tripCodes(body?.codes);
  const itinerary = itineraryFor(order, codes);
  const origin = siteOrigin(new URL(req.url).origin);

  // With Stripe configured: send the customer to Stripe's payment page; emails go out after payment.
  if (paymentsEnabled()) {
    try {
      const checkoutUrl = await createCheckout({
        orderId,
        order,
        total,
        summary,
        origin,
        cancelPath: `/order?b=${encodeBooking(order.booking)}&cancelled=1`,
        holdRequest,
        itinerary,
      });
      return NextResponse.json({ orderId, checkoutUrl, codes });
    } catch (e) {
      console.error("Stripe checkout failed", e);
      return NextResponse.json({ error: "We couldn't start the payment. Please try again." }, { status: 502 });
    }
  }

  // No payment step: reserve the flight right away as a hold order (real airline booking reference).
  // No payment step: reserve the flight right away as a hold order (real airline booking reference).
  let pnr: string | undefined;
  let holdUntil: string | null = null;
  let duffelOrderId: string | undefined;
  let holdText = "";
  if (holdRequest) {
    try {
      const hold = await placeHold(holdRequest);
      pnr = hold.bookingReference;
      holdUntil = hold.paymentRequiredBy;
      duffelOrderId = hold.orderId;
      holdText = holdSummary(hold);
    } catch (e) {
      console.error("Flight hold failed", e);
      const reason = e instanceof Error && e.message ? ` (${e.message})` : "";
      return NextResponse.json(
        {
          error: `This flight could not be reserved${reason}. Please check your details, or search again and pick another flight.`,
        },
        { status: 409 },
      );
    }
  }

  try {
    await sendOrderEmails(orderId, holdText + summary, order.contact.email, order.booking.service, itinerary, origin);
  } catch (e) {
    console.error("Order email failed", e, summary);
    return NextResponse.json({ error: "We couldn't submit your order right now. Please try again." }, { status: 500 });
  }
    return NextResponse.json({ orderId, total, pnr, holdUntil, duffelOrderId, codes });
}

import { NextResponse } from "next/server";
import { encodeBooking } from "@/lib/booking";
import { holdRequestFor, holdSummary, placeHold } from "@/lib/hold";
import { sendOrderEmails } from "@/lib/notify";
import { newOrderId, orderSummaryText, validateOrder } from "@/lib/orders";
import { createCheckout, paymentsEnabled } from "@/lib/payments";

export async function POST(req: Request) {
  const result = validateOrder(await req.json().catch(() => null));
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });

  const { order, total } = result;
  const orderId = newOrderId();
  const summary = orderSummaryText(orderId, order, total);
  const holdRequest = holdRequestFor(order);

  // With Stripe configured: send the customer to Stripe's payment page; emails go out after payment.
  if (paymentsEnabled()) {
    try {
      const origin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || new URL(req.url).origin;
      const checkoutUrl = await createCheckout({
        orderId,
        order,
        total,
        summary,
        origin,
        cancelPath: `/order?b=${encodeBooking(order.booking)}&cancelled=1`,
        holdRequest,
      });
      return NextResponse.json({ orderId, checkoutUrl });
    } catch (e) {
      console.error("Stripe checkout failed", e);
      return NextResponse.json({ error: "We couldn't start the payment. Please try again." }, { status: 502 });
    }
  }

  // No payment step: reserve the flight right away as a hold order (real airline booking reference).
  let pnr: string | undefined;
  let holdUntil: string | null = null;
  let holdText = "";
  if (holdRequest) {
    try {
      const result = await placeHold(holdRequest);
      pnr = result.bookingReference;
      holdUntil = result.paymentRequiredBy;
      holdText = holdSummary(result);
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
    await sendOrderEmails(orderId, holdText + summary, order.contact.email, order.booking.service);
  } catch (e) {
    console.error("Order email failed", e, summary);
    return NextResponse.json({ error: "We couldn't submit your order right now. Please try again." }, { status: 500 });
  }
  return NextResponse.json({ orderId, total, pnr, holdUntil });
}

import { NextResponse } from "next/server";
import { encodeBooking } from "@/lib/booking";
import { sendOrderEmails } from "@/lib/notify";
import { newOrderId, orderSummaryText, validateOrder } from "@/lib/orders";
import { createCheckout, paymentsEnabled } from "@/lib/payments";

export async function POST(req: Request) {
  const result = validateOrder(await req.json().catch(() => null));
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });

  const { order, total } = result;
  const orderId = newOrderId();
  const summary = orderSummaryText(orderId, order, total);

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
      });
      return NextResponse.json({ orderId, checkoutUrl });
    } catch (e) {
      console.error("Stripe checkout failed", e);
      return NextResponse.json({ error: "We couldn't start the payment. Please try again." }, { status: 502 });
    }
  }

  try {
    await sendOrderEmails(orderId, summary, order.contact.email, order.booking.service);
  } catch (e) {
    console.error("Order email failed", e, summary);
    return NextResponse.json({ error: "We couldn't submit your order right now. Please try again." }, { status: 500 });
  }
  return NextResponse.json({ orderId, total });
}

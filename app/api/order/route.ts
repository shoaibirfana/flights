import { NextResponse } from "next/server";
import { sendMail } from "@/lib/mailer";
import { newOrderId, orderSummaryText, validateOrder } from "@/lib/orders";
import { site } from "@/lib/site";

export async function POST(req: Request) {
  const result = validateOrder(await req.json().catch(() => null));
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });

  const { order, total } = result;
  const orderId = newOrderId();
  const summary = orderSummaryText(orderId, order, total);

  try {
    await sendMail(
      process.env.ORDER_NOTIFY_EMAIL || site.email,
      `New order ${orderId}: ${order.booking.service} reservation`,
      summary,
      order.contact.email,
    );
    await sendMail(
      order.contact.email,
      `We received your order ${orderId}`,
      `Thank you for your order with ${site.name}.\n\nOur team will contact you shortly to confirm your reservation.\n\n${summary}\n\nQuestions? Reply to this email or WhatsApp us at ${site.phoneDisplay}.`,
    );
  } catch (e) {
    console.error("Order email failed", e, summary);
    return NextResponse.json(
      { error: "We couldn't submit your order right now. Please try again or contact us on WhatsApp." },
      { status: 500 },
    );
  }

  return NextResponse.json({ orderId, total });
}

import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe, notifyPaid } from "@/lib/payments";

// Stripe calls this after a payment. Endpoint: https://YOUR-SITE/api/stripe-webhook
// Events: checkout.session.completed, checkout.session.async_payment_succeeded
export async function POST(req: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!stripe || !secret) return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await req.text(), req.headers.get("stripe-signature") ?? "", secret);
  } catch (e) {
    console.error("Stripe webhook signature check failed", e);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    try {
      await notifyPaid(event.data.object);
    } catch (e) {
      console.error("Order notification failed", e);
      return NextResponse.json({ error: "Notification failed" }, { status: 500 }); // Stripe will retry
    }
  }
  return NextResponse.json({ received: true });
}

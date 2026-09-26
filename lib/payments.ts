// Card / Apple Pay / Google Pay payments through Stripe Checkout (Stripe's hosted payment page).
// Payments switch on when STRIPE_SECRET_KEY is set; without it, orders are submitted without payment.
//
// There is no database: the order summary travels in the Checkout Session's metadata, and the order
// emails are sent only once Stripe confirms the payment (webhook, or the success page as a fallback).
import Stripe from "stripe";
import type { Order } from "./booking";
import { sendOrderEmails } from "./notify";
import { formatPrice, site } from "./site";

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  return key ? new Stripe(key) : null;
}

export const paymentsEnabled = () => Boolean(process.env.STRIPE_SECRET_KEY?.trim());
export const webhookConfigured = () => Boolean(process.env.STRIPE_WEBHOOK_SECRET?.trim());

// Stripe metadata values are limited to 500 characters (50 keys), so the summary is split into parts.
const CHUNK = 490;
const MAX_CHUNKS = 40;

function packSummary(text: string): Record<string, string> {
  const parts: Record<string, string> = {};
  for (let i = 0; i < MAX_CHUNKS && i * CHUNK < text.length; i++) parts[`s${i}`] = text.slice(i * CHUNK, (i + 1) * CHUNK);
  return parts;
}

function unpackSummary(meta: Stripe.Metadata): string {
  let text = "";
  for (let i = 0; i < MAX_CHUNKS && meta[`s${i}`] !== undefined; i++) text += meta[`s${i}`];
  return text;
}

export async function createCheckout(opts: {
  orderId: string;
  order: Order;
  total: number;
  summary: string;
  origin: string;
  cancelPath: string;
}): Promise<string> {
  const stripe = getStripe()!;
  const { orderId, order, total } = opts;
  const service = order.booking.service === "flight" ? "Flight" : "Hotel";
  const travelers = order.booking.travelers;
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: site.currency.toLowerCase(),
          unit_amount: Math.round(total * 100),
          product_data: {
            name: `${service} reservation for visa`,
            description: `${travelers} ${travelers === 1 ? "traveler" : "travelers"} · Order ${orderId}`,
          },
        },
      },
    ],
    customer_email: order.contact.email,
    client_reference_id: orderId,
    metadata: { orderId, service: order.booking.service, ...packSummary(opts.summary) },
    payment_intent_data: { description: `${site.name} order ${orderId}`, metadata: { orderId } },
    success_url: `${opts.origin}/order/success?id=${encodeURIComponent(orderId)}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${opts.origin}${opts.cancelPath}`,
  });
  if (!session.url) throw new Error("Stripe did not return a checkout URL");
  return session.url;
}

// Sends the order emails once per paid session (marks the session as notified afterwards).
export async function notifyPaid(session: Stripe.Checkout.Session) {
  if (session.payment_status !== "paid" || session.metadata?.notified === "1") return;
  const meta = session.metadata ?? {};
  const orderId = meta.orderId || session.client_reference_id || session.id;
  const email = session.customer_details?.email || session.customer_email;
  const paid = formatPrice((session.amount_total ?? 0) / 100);
  const summary = `PAYMENT RECEIVED: ${paid} ${site.currency} (Stripe ${session.payment_intent ?? session.id})\n\n${unpackSummary(meta)}`;
  if (email) await sendOrderEmails(orderId, summary, email, meta.service || "visa");
  await getStripe()!.checkout.sessions.update(session.id, { metadata: { notified: "1" } });
}

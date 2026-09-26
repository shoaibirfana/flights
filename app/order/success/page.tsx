import Link from "next/link";
import type { Metadata } from "next";
import { getStripe, notifyPaid, webhookConfigured } from "@/lib/payments";

export const metadata: Metadata = { title: "Order Received" };
export const dynamic = "force-dynamic";

type PaymentState = "none" | "paid" | "unpaid";

async function checkPayment(sessionId: string | undefined, orderId: string): Promise<PaymentState> {
  const stripe = getStripe();
  if (!sessionId || !stripe) return "none";
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.client_reference_id !== orderId) return "unpaid";
    if (session.payment_status !== "paid") return "unpaid";
    // Without a webhook, the success page sends the order emails (once per session).
    if (!webhookConfigured()) await notifyPaid(session).catch((e) => console.error("Order notification failed", e));
    return "paid";
  } catch (e) {
    console.error("Could not verify Stripe session", e);
    return "unpaid";
  }
}

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; session_id?: string }>;
}) {
  const { id, session_id } = await searchParams;
  const orderId = (id ?? "").replace(/[^A-Z0-9-]/gi, "").slice(0, 30);
  const payment = await checkPayment(session_id, orderId);

  if (payment === "unpaid") {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-3xl text-amber-600">!</div>
        <h1 className="mt-6 text-3xl font-bold">Payment not completed</h1>
        <p className="mt-4 leading-relaxed text-gray-600">
          We couldn&apos;t confirm your payment{orderId && <> for order <strong>{orderId}</strong></>}. You have not been
          charged. Please search again and place a new order.
        </p>
        <Link href="/#book" className="btn-primary mt-8">
          Search again
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl text-green-600">✓</div>
      <h1 className="mt-6 text-3xl font-bold">{payment === "paid" ? "Payment received!" : "Order Received!"}</h1>
      {orderId && (
        <p className="mt-3 text-gray-700">
          Your order ID is <strong className="text-brand-600">{orderId}</strong>
        </p>
      )}
      <p className="mt-4 leading-relaxed text-gray-600">
        We&apos;ve emailed you a confirmation. Our team will contact you shortly to confirm your reservation and send your
        PDF.
      </p>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Link href="/" className="btn-primary">
          Back to Home
        </Link>
      </div>
    </div>
  );
}

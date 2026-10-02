import Link from "next/link";
import type { Metadata } from "next";
import BookingReference, { StoredBookingReference } from "@/components/BookingReference";
import TripSummaryLink from "@/components/TripSummaryLink";
import { getStripe, notifyPaid, webhookConfigured } from "@/lib/payments";

export const metadata: Metadata = { title: "Order Received" };
export const dynamic = "force-dynamic";

type PaymentState = "none" | "paid" | "unpaid";
type Checked = { state: PaymentState; pnr?: string; holdUntil?: string };

async function checkPayment(sessionId: string | undefined, orderId: string): Promise<Checked> {
  const stripe = getStripe();
  if (!sessionId || !stripe) return { state: "none" };
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.client_reference_id !== orderId) return { state: "unpaid" };
    if (session.payment_status !== "paid") return { state: "unpaid" };
    // Without a webhook, the success page creates the hold and sends the emails (once per session).
    let extra: Record<string, string> | undefined;
    if (!webhookConfigured()) extra = await notifyPaid(session).catch((e) => (console.error("Order notification failed", e), undefined));
    const pnr = extra?.pnr ?? session.metadata?.pnr;
    const holdUntil = extra?.holdUntil ?? session.metadata?.holdUntil;
    return { state: "paid", pnr, holdUntil };
  } catch (e) {
    console.error("Could not verify Stripe session", e);
    return { state: "unpaid" };
  }
}

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; session_id?: string }>;
}) {
  const { id, session_id } = await searchParams;
  const orderId = (id ?? "").replace(/[^A-Z0-9-]/gi, "").slice(0, 30);
  const { state: payment, pnr, holdUntil } = await checkPayment(session_id, orderId);

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
      {pnr ? (
        <BookingReference pnr={pnr} holdUntil={holdUntil} />
      ) : (
        payment === "none" && <StoredBookingReference orderId={orderId} />
      )}
      <p className="mt-4 leading-relaxed text-gray-600">
        We&apos;ve emailed you a confirmation with your booking reference. Contact us if you have any questions about
        your reservation.
      </p>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Link href="/" className="btn-primary">
          Back to Home
        </Link>
        <TripSummaryLink />
      </div>
    </div>
  );
}

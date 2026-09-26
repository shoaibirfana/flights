import Link from "next/link";
import type { Metadata } from "next";
import OrderForm from "@/components/OrderForm";
import { bookingPrice, decodeBooking, describeBooking } from "@/lib/booking";
import { paymentsEnabled } from "@/lib/payments";
import { formatPrice } from "@/lib/site";

export const metadata: Metadata = { title: "Complete Your Booking" };

export const dynamic = "force-dynamic";

export default async function OrderPage({
  searchParams,
}: {
  searchParams: Promise<{ b?: string; cancelled?: string }>;
}) {
  const { b, cancelled } = await searchParams;
  const booking = decodeBooking(b);

  if (!booking) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Booking details missing</h1>
        <p className="mt-3 text-gray-600">Please start by entering your flight or hotel details.</p>
        <Link href="/#book" className="btn-primary mt-6">
          Start Booking
        </Link>
      </div>
    );
  }

  const price = bookingPrice(booking);
  const pay = paymentsEnabled();

  return (
    <div className="bg-gray-50">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h1 className="text-2xl font-bold md:text-3xl">Complete Your Booking</h1>
          <p className="mt-2 text-gray-600">
            Enter the traveler names exactly as they appear on the passports.
          </p>
          {cancelled && (
            <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Payment was cancelled and you have not been charged. You can try again below.
            </p>
          )}
          <OrderForm booking={booking} encoded={b!} payLabel={pay ? `Pay ${formatPrice(price)} →` : null} />
        </div>
        <aside className="h-fit rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 lg:sticky lg:top-24">
          <h2 className="text-lg font-semibold">Booking Summary</h2>
          <ul className="mt-4 space-y-2 text-sm text-gray-700">
            {describeBooking(booking).map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
            <span className="font-medium">Service fee</span>
            <span className="text-2xl font-bold text-brand-600">{formatPrice(price)}</span>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            {pay
              ? "Secure payment by card, Apple Pay or Google Pay on the next step."
              : "No payment is taken now. Our team will contact you to confirm your order."}
          </p>
          <Link href={`/search?b=${encodeURIComponent(b!)}`} className="mt-4 block text-sm text-brand-600 hover:underline">
            ← Back to results
          </Link>
        </aside>
      </div>
    </div>
  );
}

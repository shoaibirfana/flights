import Link from "next/link";
import type { Metadata } from "next";
import TripSummary from "@/components/TripSummary";
import { bookingPrice, decodeBooking } from "@/lib/booking";
import { getOrderDetails } from "@/lib/providers/duffel";
import { formatPrice } from "@/lib/site";

export const metadata: Metadata = { title: "Trip Summary", robots: { index: false } };

export const dynamic = "force-dynamic";

export default async function TripSummaryPage({
  searchParams,
}: {
  searchParams: Promise<{ b?: string; o?: string }>;
}) {
  const { b, o } = await searchParams;
  const booking = decodeBooking(b);

  if (!booking) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Trip details missing</h1>
        <p className="mt-3 text-gray-600">Please start by entering your flight details.</p>
        <Link href="/#book" className="btn-primary mt-6">
          Start Booking
        </Link>
      </div>
    );
  }

  // Only trust a well-formed Duffel order ID; ignore anything else.
  const orderId = typeof o === "string" && /^ord_[A-Za-z0-9]+$/.test(o) ? o : null;
  let order: Awaited<ReturnType<typeof getOrderDetails>> | null = null;
  if (orderId) {
    try {
      order = await getOrderDetails(orderId);
    } catch (e) {
      console.error("Duffel getOrderDetails failed", orderId, e);
    }
  }

  return (
    <TripSummary
      booking={booking}
      encoded={b!}
      price={formatPrice(bookingPrice(booking))}
      order={order}
    />
  );
}

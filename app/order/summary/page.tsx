import Link from "next/link";
import type { Metadata } from "next";
import TripSummary from "@/components/TripSummary";
import { bookingPrice, decodeBooking } from "@/lib/booking";
import { formatPrice } from "@/lib/site";

export const metadata: Metadata = { title: "Trip Summary", robots: { index: false } };

export const dynamic = "force-dynamic";

export default async function TripSummaryPage({ searchParams }: { searchParams: Promise<{ b?: string }> }) {
  const { b } = await searchParams;
  const booking = decodeBooking(b);

  if (!booking) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Trip details missing</h1>
        <p className="mt-3 text-gray-600">Please start by entering your flight or hotel details.</p>
        <Link href="/#book" className="btn-primary mt-6">
          Start Booking
        </Link>
      </div>
    );
  }

  return <TripSummary booking={booking} encoded={b!} price={formatPrice(bookingPrice(booking))} />;
}

import Link from "next/link";
import type { Metadata } from "next";
import TripSummary from "@/components/TripSummary";
import { bookingPrice, decodeBooking } from "@/lib/booking";
import { getOrderDetails } from "@/lib/providers/duffel";
import { formatPrice } from "@/lib/site";

export const metadata: Metadata = { title: "Trip Summary", robots: { index: false } };

export const dynamic = "force-dynamic";

// DEMO: shows the itinerary design even without a real Duffel order.
// Set to false (or delete the whole PREVIEW block) before final submission.
const PREVIEW_MODE = true;

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

  // DEMO fallback — builds a fake order from the search the user already did,
  // so the new itinerary layout renders without a real hold order.
  if (!order && PREVIEW_MODE) {
    const leg = booking.legs?.[0];
    order = {
      orderId: "ord_preview",
      airlineBookingReference: "DEMO123",
      status: "On hold (awaiting payment)",
      payBy: new Date(Date.now() + 86400_000).toISOString(),
      airline: {
        name: "Qatar Airways",
        code: "QR",
        logoSymbol: null,
        logoLockup: null,
      },
      passengers: ["MR SHOAIB IRFAN"],
      tripDate: leg?.date ?? "2026-10-19",
      destination: {
        code: leg?.toCode ?? "LHE",
        name: "Allama Iqbal International Airport",
        city: "Lahore",
      },
      slices: [
        {
          from: {
            code: leg?.fromCode ?? "KHI",
            name: "Jinnah International Airport",
            city: "Karachi",
          },
          to: {
            code: leg?.toCode ?? "LHE",
            name: "Allama Iqbal International Airport",
            city: "Lahore",
          },
          date: leg?.date ?? "2026-10-19",
          duration: "1h 56m",
          flights: [
            {
              airline: "Qatar Airways",
              airlineCode: "QR",
              logoSymbol: null,
              logoLockup: null,
              operatedBy: "Qatar Airways",
              flightNumber: "QR629",
              from: {
                code: leg?.fromCode ?? "KHI",
                name: "Jinnah International Airport",
                city: "Karachi",
              },
              to: {
                code: leg?.toCode ?? "LHE",
                name: "Allama Iqbal International Airport",
                city: "Lahore",
              },
              departDate: leg?.date ?? "2026-10-19",
              departTime: "11:36",
              arriveDate: leg?.date ?? "2026-10-19",
              arriveTime: "13:32",
              duration: "1h 56m",
              cabinClass: "Economy",
              aircraft: "Boeing 777-300",
              connection: null,
            },
          ],
        },
      ],
    };
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

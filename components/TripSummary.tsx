"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { describeBooking, type BookingRequest, type Selection } from "@/lib/booking";
import { site } from "@/lib/site";
import { LogoMark } from "./Logo";
import { SELECTION_KEY } from "./SearchResults";

// Free, printable reminder of the trip the customer picked. Deliberately NOT a ticket or reservation:
// our own branding only, no airline logos, no booking reference, and a disclaimer that prints with it.
export default function TripSummary({
  booking,
  encoded,
  price,
}: {
  booking: BookingRequest;
  encoded: string;
  price: string;
}) {
  const [selections, setSelections] = useState<Selection[] | null | undefined>(undefined);

  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(SELECTION_KEY) || "null");
      setSelections(saved?.booking === encoded ? saved.selections : null);
    } catch {
      setSelections(null);
    }
  }, [encoded]);

  if (selections === undefined) return null;
  if (!selections) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <p className="text-gray-700">Please choose your {booking.service} from the search results first.</p>
        <Link href={`/search?b=${encodeURIComponent(encoded)}`} className="btn-primary mt-4">
          View results
        </Link>
      </div>
    );
  }

  const created = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="bg-gray-50 print:bg-white">
      <div className="mx-auto max-w-3xl px-4 py-12 print:p-0">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <Link href={`/order?b=${encodeURIComponent(encoded)}`} className="text-sm text-brand-600 hover:underline">
            ← Back to booking
          </Link>
          <button onClick={() => window.print()} className="btn-outline !px-4 !py-2 text-sm">
            Print / Save as PDF
          </button>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 md:p-10 print:rounded-none print:shadow-none print:ring-0">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 flex items-center justify-center text-6xl font-bold uppercase tracking-widest text-gray-100 [transform:rotate(-30deg)] md:text-8xl"
          >
            Not a ticket
          </div>

          <div className="relative">
            <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-5">
              <div className="flex items-center gap-3">
                <LogoMark className="h-8 w-auto" />
                <span className="font-semibold uppercase tracking-wide">{site.name}</span>
              </div>
              <span className="text-xs text-gray-500">Created {created}</span>
            </div>

            <h1 className="mt-6 text-2xl font-bold md:text-3xl">Trip Summary</h1>
            <p className="mt-3 rounded-lg border-2 border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
              For your own reference only. This is not a ticket, booking or reservation, has no booking reference
              and cannot be used for travel or a visa application.
            </p>

            <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-gray-500">
              {booking.service === "flight" ? "Selected flight" : "Selected hotels"}
            </h2>
            <div className="mt-3 space-y-5">
              {selections.map((s) => (
                <ul key={s.ref} className="space-y-1.5 text-gray-800">
                  {s.summary.map((l, i) => (
                    <li key={i} className={i === 0 ? "text-lg font-semibold text-navy-900" : ""}>
                      {l}
                    </li>
                  ))}
                </ul>
              ))}
            </div>

            <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-gray-500">Trip dates</h2>
            <ul className="mt-3 space-y-1.5 text-gray-800">
              {describeBooking(booking).map((l, i) => (
                <li key={l}>{i === 0 ? l.replace(" reservation", "") : l}</li>
              ))}
            </ul>

            <p className="mt-8 border-t border-gray-100 pt-4 text-xs text-gray-500">
              Flight times and availability can change. Check with the airline or hotel before you travel.
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-navy-900 p-6 text-white md:flex md:items-center md:justify-between md:gap-6 print:hidden">
          <div>
            <h2 className="text-lg font-semibold">Need it for a visa application?</h2>
            <p className="mt-1 text-sm text-gray-300">
              Get a verifiable reservation with a booking reference (PNR), emailed as a PDF.
            </p>
          </div>
          <Link
            href={`/order?b=${encodeURIComponent(encoded)}`}
            className="mt-4 inline-flex shrink-0 items-center justify-center rounded-lg bg-white px-6 py-3 font-semibold text-navy-900 hover:bg-brand-50 md:mt-0"
          >
            Get reservation · {price}
          </Link>
        </div>
      </div>
    </div>
  );
}

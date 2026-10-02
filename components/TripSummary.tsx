"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { describeBooking, type BookingRequest, type Selection } from "@/lib/booking";
import { site } from "@/lib/site";
import { LogoMark } from "./Logo";
import { SELECTION_KEY } from "./SearchResults";

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
  const [bookingNo, setBookingNo] = useState<string>("");

  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(SELECTION_KEY) || "null");
      if (saved?.booking === encoded) {
        setSelections(saved.selections);
        // Our own booking number — generated & persisted per selection
        const key = `trip:${encoded}:no`;
        let no = sessionStorage.getItem(key);
        if (!no) {
          no = "TW" + Date.now().toString().slice(-12); // e.g. TW123456789012
          sessionStorage.setItem(key, no);
        }
        setBookingNo(no);
      } else {
        setSelections(null);
      }
    } catch {
      setSelections(null);
    }
  }, [encoded]);

  if (selections === undefined) return null;
  if (!selections) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <p className="text-gray-700">
          Please choose your {booking.service} from the search results first.
        </p>
        <Link href={`/search?b=${encodeURIComponent(encoded)}`} className="btn-primary mt-4">
          View results
        </Link>
      </div>
    );
  }

  const created = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="bg-gray-50 print:bg-white">
      <div className="mx-auto max-w-3xl px-4 py-12 print:max-w-none print:p-0">
        {/* Toolbar (hidden on print) */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <Link
            href={`/order?b=${encodeURIComponent(encoded)}`}
            className="text-sm text-brand-600 hover:underline"
          >
            ← Back to booking
          </Link>
          <button onClick={() => window.print()} className="btn-outline !px-4 !py-2 text-sm">
            Print / Save as PDF
          </button>
        </div>

        <article className="relative rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 md:p-10 print:rounded-none print:p-0 print:shadow-none print:ring-0">
          {/* Watermark */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 flex items-center justify-center text-6xl font-bold uppercase tracking-widest text-gray-100 [transform:rotate(-30deg)] md:text-8xl print:text-gray-100"
          >
            Not a ticket
          </div>

          <div className="relative space-y-8">
            {/* Header */}
            <header className="flex items-center justify-between gap-4 border-b border-gray-200 pb-5">
              <div className="flex items-center gap-3">
                <LogoMark className="h-8 w-auto" />
                <span className="font-semibold uppercase tracking-wide">{site.name}</span>
              </div>
              <span className="text-xs text-gray-500">Created {created}</span>
            </header>

            {/* Booking information */}
            <section>
              <h1 className="text-2xl font-bold md:text-3xl">Trip Summary</h1>
              <p className="mt-3 rounded-lg border-2 border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
                For your own reference only. This is <strong>not a ticket, booking or reservation</strong>,
                has no booking reference and cannot be used for travel or a visa application.
              </p>

              <dl className="mt-6 grid grid-cols-1 gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-gray-500">Booking No.</dt>
                  <dd className="font-mono font-semibold text-navy-900">{bookingNo || "—"}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Passenger</dt>
                  <dd className="font-semibold text-navy-900">
                    {/* pull from selections if present */}
                    {/* e.g. (selections[0] as any).passengerName ?? "—" */}
                    —
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Class</dt>
                  <dd>Economy</dd>
                </div>
                <div>
                  <dt className="text-gray-500">E-ticket No.</dt>
                  <dd className="font-mono">xxx</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Airline Booking Reference</dt>
                  <dd className="font-mono">xxx</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Service</dt>
                  <dd className="capitalize">{booking.service}</dd>
                </div>
              </dl>
            </section>

            {/* Selected items */}
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
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
            </section>

            {/* Trip dates */}
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Trip dates</h2>
              <ul className="mt-3 space-y-1.5 text-gray-800">
                {describeBooking(booking).map((l, i) => (
                  <li key={l}>{i === 0 ? l.replace(" reservation", "") : l}</li>
                ))}
              </ul>
            </section>

            {/* Important information — mirrors the uploaded PDF */}
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                Important information
              </h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-gray-700">
                <li>
                  Passengers should arrive at the airport at least <strong>2 hours before departure</strong> to
                  ensure they have enough time to check in.
                </li>
                <li>
                  During various procedures at the airport, passengers must provide the valid ID used to purchase
                  their ticket. Their boarding pass or itinerary may also be required.
                </li>
                <li>
                  Tickets must be used in the sequence set out in the itinerary, otherwise airlines reserve the
                  right to refuse carriage.
                </li>
                <li>
                  We suggest arriving at the airport at least <strong>3 hours prior</strong> to departure for
                  international flights.
                </li>
              </ul>
            </section>

            <p className="border-t border-gray-100 pt-4 text-xs text-gray-500">
              Flight times and availability can change. Check with the airline or hotel before you travel.
            </p>
          </div>
        </article>

        {/* Upsell (hidden on print) */}
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

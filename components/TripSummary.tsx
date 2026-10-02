"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { describeBooking, type BookingRequest, type Selection } from "@/lib/booking";
import { site } from "@/lib/site";
import { LogoMark } from "./Logo";
import { SELECTION_KEY } from "./SearchResults";

const fmtDateTime = (iso: string) => {
  // "2026-10-16T09:55:00" -> "2026-10-16 09:55"
  return iso.replace("T", " ").slice(0, 16);
};

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
        const key = `trip:${encoded}:no`;
        let no = sessionStorage.getItem(key);
        if (!no) {
          no = "TW" + Date.now().toString().slice(-12);
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

        <article className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 md:p-10 print:rounded-none print:p-0 print:shadow-none print:ring-0">
          {/* Header with logo + site name */}
          <header className="flex items-center justify-between gap-4 border-b border-gray-200 pb-5">
            <div className="flex items-center gap-3">
              <LogoMark className="h-8 w-auto" />
              <span className="font-semibold uppercase tracking-wide">{site.name}</span>
            </div>
            <span className="text-xs text-gray-500">Created {created}</span>
          </header>

          {/* Booking Information */}
          <section className="mt-6">
            <h1 className="text-lg font-bold text-navy-900">Booking Information</h1>
            <p className="mt-2 text-sm text-gray-700">
              We advise you print out your itinerary and take it with you to ensure your trip goes as smoothly
              as possible.
            </p>

            <p className="mt-4 text-sm font-semibold text-navy-900">
              Booking No. {bookingNo || "—"}
            </p>

            <div className="mt-4 overflow-hidden rounded-lg border border-gray-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Passenger</th>
                    <th className="px-4 py-3 font-semibold">Class</th>
                    <th className="px-4 py-3 font-semibold">E-ticket No.</th>
                    <th className="px-4 py-3 font-semibold">Airline Booking Reference</th>
                  </tr>
                </thead>
                <tbody className="text-gray-800">
                  <tr className="border-t border-gray-100">
                    <td className="px-4 py-3">—</td>
                    <td className="px-4 py-3 capitalize">{booking.cabin ?? "Economy"}</td>
                    <td className="px-4 py-3 font-mono">XXX</td>
                    <td className="px-4 py-3 font-mono">XXX</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Flight Information */}
          <section className="mt-8">
            <h2 className="text-lg font-bold text-navy-900">Flight Information</h2>
            <div className="mt-4 space-y-6">
              {selections.map((s) => (
                <div key={s.ref}>
                  {/* Airline + route header */}
                  <ul className="space-y-1 text-sm text-gray-800">
                    {s.summary.map((l, i) => (
                      <li key={i} className={i === 0 ? "text-base font-semibold text-navy-900" : ""}>
                        {l}
                      </li>
                    ))}
                  </ul>

                  {/* Per-segment table */}
                  {s.segments && s.segments.length > 0 && (
                    <div className="mt-4 overflow-hidden rounded-lg border border-gray-200">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                          <tr>
                            <th className="px-3 py-2 font-semibold">Flight</th>
                            <th className="px-3 py-2 font-semibold">From</th>
                            <th className="px-3 py-2 font-semibold">To</th>
                            <th className="px-3 py-2 font-semibold">Departure</th>
                            <th className="px-3 py-2 font-semibold">Arrival</th>
                          </tr>
                        </thead>
                        <tbody className="text-gray-800">
                          {s.segments.map((seg, i) => (
                            <tr key={i} className="border-t border-gray-100 align-top">
                              <td className="px-3 py-2 font-mono font-semibold text-navy-900">
                                {seg.flightNumber}
                              </td>
                              <td className="px-3 py-2">
                                {seg.fromName} ({seg.from})
                              </td>
                              <td className="px-3 py-2">
                                {seg.toName} ({seg.to})
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap">
                                {fmtDateTime(seg.departAt)}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap">
                                {fmtDateTime(seg.arriveAt)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Baggage Allowance */}
          <section className="mt-8">
            <h2 className="text-lg font-bold text-navy-900">Baggage Allowance</h2>
            <p className="mt-2 text-sm text-gray-700">
              Please check the baggage information at the bottom for more details.
            </p>
            <div className="mt-4 space-y-4 text-sm text-gray-800">
              <div>
                <p className="font-semibold">Adults</p>
                <p className="mt-1">
                  <span className="font-semibold">Carry-on baggage:</span> Please contact the airline for
                  detailed baggage policies
                </p>
                <p className="mt-1">
                  <span className="font-semibold">Checked baggage:</span> Please contact the airline for
                  detailed baggage policies
                </p>
              </div>
            </div>
          </section>

          {/* Important information */}
          <section className="mt-8">
            <h2 className="text-lg font-bold text-navy-900">Important information</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-gray-700">
              <li>
                Passengers should arrive at the airport at least 2 hours before departure to ensure they have
                enough time to check in.
              </li>
              <li>
                During various procedures in the airport, passengers must provide the valid ID used to purchase
                their ticket. Their boarding pass or itinerary may also be required.
              </li>
              <li>
                Please note that tickets must be used in the sequence set out in the itinerary, otherwise
                airlines reserve the right to refuse carriage. {site.name} bears no responsibility if
                passengers are unable to board a plane due to not complying with airline policies and
                regulations.
              </li>
              <li>
                We make the suggestion to arrive at the airport at least 3h prior to departure to ensure you
                have enough time to check in.
              </li>
            </ul>
          </section>

          <p className="mt-8 border-t border-gray-100 pt-4 text-xs text-gray-500">
            Flight times and availability can change. Check with the airline or hotel before you travel.
          </p>
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

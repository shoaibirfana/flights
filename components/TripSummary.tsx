"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  describeBooking,
  type BookingRequest,
  type FlightSegment,
  type Selection,
} from "@/lib/booking";
import type { getOrderDetails } from "@/lib/providers/duffel";
import { site } from "@/lib/site";
import { LogoMark } from "./Logo";
import { SELECTION_KEY } from "./SearchResults";

type OrderDetails = Awaited<ReturnType<typeof getOrderDetails>>;

const fmtDateTime = (iso: string) => iso.replace("T", " ").slice(0, 16);

/* ---------- Shared footer (partners) ---------- */
function PartnerStrip() {
  return (
    <div className="mt-8 border-t border-gray-200 pt-5">
      <p className="mb-2 text-center text-[10px] uppercase tracking-widest text-gray-400">
        Trusted by travel agencies worldwide
      </p>
      <div className="flex flex-nowrap items-center justify-center gap-x-4 overflow-hidden">
        {Array.from({ length: 11 }, (_, i) => i + 1).map((n) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={n}
            src={`/partners/${n}.png`}
            alt=""
            className="h-5 w-auto shrink-0 object-contain grayscale"
          />
        ))}
      </div>
    </div>
  );
}

/* ---------- One flight card, matching the Qatar PDF layout ---------- */
function FlightCard({
  f,
}: {
  f: OrderDetails["slices"][number]["flights"][number];
}) {
  return (
    <div className="border border-gray-300 p-4">
      {/* Header: airline logo + name + flight no + date */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 pb-2">
        <div className="flex items-center gap-2">
          {f.logoSymbol ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={f.logoSymbol} alt="" className="h-7 w-7 object-contain" />
          ) : null}
          <span className="font-semibold text-navy-900">
            FLIGHT — {f.airline.toUpperCase()} {f.flightNumber}
          </span>
        </div>
        <span className="text-xs text-gray-500">{f.departDate}</span>
      </div>

      {/* Depart / Arrive block */}
      <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-gray-500">Depart</div>
          <div className="font-semibold">
            {f.from.code} — {f.from.name}
          </div>
          <div className="text-gray-700">
            {f.departTime} · {f.departDate}
          </div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wide text-gray-500">Arrive</div>
          <div className="font-semibold">
            {f.to.code} — {f.to.name}
          </div>
          <div className="text-gray-700">
            {f.arriveTime} · {f.arriveDate}
          </div>
        </div>
      </div>

      {/* Fact row — single row, no duplicates */}
      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 border-t border-gray-200 pt-3 text-xs text-gray-700 sm:grid-cols-4">
        <div>
          <span className="text-gray-500">Flight number: </span>
          <span className="font-medium">{f.flightNumber}</span>
        </div>
        <div>
          <span className="text-gray-500">Duration: </span>
          <span className="font-medium">{f.duration || "—"}</span>
        </div>
        <div>
          <span className="text-gray-500">Class: </span>
          <span className="font-medium">{f.cabinClass ?? "Economy"}</span>
        </div>
        <div>
          <span className="text-gray-500">Aircraft: </span>
          <span className="font-medium">{f.aircraft ?? "—"}</span>
        </div>
        {f.operatedBy && f.operatedBy !== f.airline ? (
          <div className="col-span-2 sm:col-span-4">
            <span className="text-gray-500">Operated by: </span>
            <span className="font-medium">{f.operatedBy}</span>
          </div>
        ) : null}
        {f.connection ? (
          <div className="col-span-2 sm:col-span-4">
            <span className="text-gray-500">Transfer: </span>
            <span className="font-medium">
              {f.connection.airport.name} ({f.connection.airport.code}) · wait {f.connection.wait}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function TripSummary({
  booking,
  encoded,
  price,
  order,
}: {
  booking: BookingRequest;
  encoded: string;
  price: string;
  order: OrderDetails | null;
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

  /* ---------- Verified path: real Duffel order ---------- */
  if (order) {
    const created = new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const dest = order.destination;
    const tripLine = dest
      ? `TRIP TO ${dest.city || dest.name}${dest.code ? ` (${dest.code})` : ""}`
      : "TRIP";

    const payBy = order.payBy
      ? new Date(order.payBy).toLocaleString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : null;

    return (
      <div className="bg-gray-50 print:bg-white">
        <div className="mx-auto max-w-3xl px-4 py-12 print:max-w-none print:p-0">
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

          <article className="border border-gray-200 bg-white p-6 md:p-10 print:border-0 print:p-0">
            <header className="flex items-center justify-between gap-4 border-b border-gray-300 pb-5">
              <div className="flex items-center gap-3">
                <LogoMark className="h-8 w-auto" />
                <span className="font-semibold uppercase tracking-wide">{site.name}</span>
              </div>
              <span className="text-xs text-gray-500">Created {created}</span>
            </header>

            <h1 className="mt-6 text-lg font-bold text-navy-900">
              {tripLine}
              {order.tripDate ? ` · ${order.tripDate}` : ""}
            </h1>

            {/* Traveler / booking table */}
            <div className="mt-4 overflow-hidden border border-gray-300">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Traveler(s)</th>
                    <th className="px-4 py-3 font-semibold">Reservation code</th>
                    <th className="px-4 py-3 font-semibold">E-ticket no.</th>
                    <th className="px-4 py-3 font-semibold">Airline reservation code</th>
                  </tr>
                </thead>
                <tbody className="text-gray-800">
                  {order.passengers.map((p) => (
                    <tr key={p} className="border-t border-gray-200">
                      <td className="px-4 py-3 font-semibold">{p}</td>
                      <td className="px-4 py-3 font-mono">{order.airlineBookingReference}</td>
                      <td className="px-4 py-3 text-gray-500">Not issued (on hold)</td>
                      <td className="px-4 py-3 font-mono">{order.airlineBookingReference}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-3 text-xs text-gray-600">
              <span className="text-gray-500">Status: </span>
              <strong>{order.status}</strong>
              {payBy ? <> · pay by {payBy}</> : null}
            </p>

            {/* Flight Information */}
            <section className="mt-8">
              <h2 className="text-lg font-bold text-navy-900">Flight Information</h2>

              <div className="mt-4 space-y-4">
                {order.slices.map((slice, si) => (
                  <div key={si} className="space-y-3">
                    {slice.flights.map((f, fi) => (
                      <FlightCard key={fi} f={f} />
                    ))}
                  </div>
                ))}
              </div>
            </section>

            <PartnerStrip />
          </article>

          {/* Upsell (hidden on print) */}
          <div className="mt-6 border border-navy-900 bg-navy-900 p-6 text-white md:flex md:items-center md:justify-between md:gap-6 print:hidden">
            <div>
              <h2 className="text-lg font-semibold">Need a paid reservation?</h2>
              <p className="mt-1 text-sm text-gray-300">
                Get a ticketed booking with an e-ticket number emailed as a PDF.
              </p>
            </div>
            <Link
              href={`/order?b=${encodeURIComponent(encoded)}`}
              className="mt-4 inline-flex shrink-0 items-center justify-center bg-white px-6 py-3 font-semibold text-navy-900 hover:bg-brand-50 md:mt-0"
            >
              Continue · {price}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ---------- Fallback path: preview from sessionStorage ---------- */
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

        <article className="border border-gray-200 bg-white p-6 md:p-10 print:border-0 print:p-0">
          <header className="flex items-center justify-between gap-4 border-b border-gray-300 pb-5">
            <div className="flex items-center gap-3">
              <LogoMark className="h-8 w-auto" />
              <span className="font-semibold uppercase tracking-wide">{site.name}</span>
            </div>
            <span className="text-xs text-gray-500">Created {created}</span>
          </header>

          <section className="mt-6">
            <h1 className="text-lg font-bold text-navy-900">Booking Information</h1>
            <p className="mt-2 text-sm text-gray-700">
              We advise you print out your itinerary and take it with you to ensure your trip goes as smoothly
              as possible.
            </p>
            <p className="mt-4 text-sm font-semibold text-navy-900">Booking No. {bookingNo || "—"}</p>

            <div className="mt-4 overflow-hidden border border-gray-300">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Passenger</th>
                    <th className="px-4 py-3 font-semibold">Class</th>
                    <th className="px-4 py-3 font-semibold">E-ticket no.</th>
                    <th className="px-4 py-3 font-semibold">Airline booking reference</th>
                  </tr>
                </thead>
                <tbody className="text-gray-800">
                  <tr className="border-t border-gray-200">
                    <td className="px-4 py-3">—</td>
                    <td className="px-4 py-3 capitalize">{booking.cabin ?? "Economy"}</td>
                    <td className="px-4 py-3 font-mono">XXX</td>
                    <td className="px-4 py-3 font-mono">XXX</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="mt-8">
            <h2 className="text-lg font-bold text-navy-900">Flight Information</h2>
            <div className="mt-4 space-y-6">
              {selections.map((s) => (
                <div key={s.ref}>
                  <ul className="space-y-1 text-sm text-gray-800">
                    {s.summary.map((l, i) => (
                      <li key={i} className={i === 0 ? "text-base font-semibold text-navy-900" : ""}>
                        {l}
                      </li>
                    ))}
                  </ul>

                  {s.segments && s.segments.length > 0 && (
                    <div className="mt-4 overflow-hidden border border-gray-300">
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
                          {s.segments.map((seg: FlightSegment, i: number) => (
                            <tr key={i} className="border-t border-gray-200 align-top">
                              <td className="px-3 py-2 font-mono font-semibold text-navy-900">
                                {seg.flightNumber}
                              </td>
                              <td className="px-3 py-2">
                                {seg.fromName} ({seg.from})
                              </td>
                              <td className="px-3 py-2">
                                {seg.toName} ({seg.to})
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap">{fmtDateTime(seg.departAt)}</td>
                              <td className="px-3 py-2 whitespace-nowrap">{fmtDateTime(seg.arriveAt)}</td>
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

          <PartnerStrip />
        </article>

        <div className="mt-6 border border-navy-900 bg-navy-900 p-6 text-white md:flex md:items-center md:justify-between md:gap-6 print:hidden">
          <div>
            <h2 className="text-lg font-semibold">Need it for a visa application?</h2>
            <p className="mt-1 text-sm text-gray-300">
              Get a verifiable reservation with a booking reference (PNR), emailed as a PDF.
            </p>
          </div>
          <Link
            href={`/order?b=${encodeURIComponent(encoded)}`}
            className="mt-4 inline-flex shrink-0 items-center justify-center bg-white px-6 py-3 font-semibold text-navy-900 hover:bg-brand-50 md:mt-0"
          >
            Get reservation · {price}
          </Link>
        </div>
      </div>
    </div>
  );
}

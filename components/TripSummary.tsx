"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  type BookingRequest,
  type FlightSegment,
  type Selection,
} from "@/lib/booking";
import { randomAirlineReservationCode, randomReservationCode } from "@/lib/codes";
import type { getOrderDetails } from "@/lib/providers/duffel";
import { site } from "@/lib/site";
import { LogoMark } from "./Logo";
import { SELECTION_KEY } from "./SearchResults";

type OrderDetails = Awaited<ReturnType<typeof getOrderDetails>>;

const BORDER = "#d4d4d4";
const GREY_PANEL = "#cccccc";
const TEXT = "#222222";

const nameLines = (name: string): string[] => {
  const words = (name || "").split(/\s+/).filter(Boolean);
  if (words.length <= 2) return words;
  const per = Math.ceil(words.length / 3);
  const out: string[] = [];
  for (let i = 0; i < words.length; i += per) out.push(words.slice(i, i + per).join(" "));
  return out.slice(0, 3);
};

const MEALS = ["Drinks and quality", "products offered", "for sale"];

function AirlineLogo({ src }: { src?: string | null }) {
  if (!src) return <div style={{ height: 44 }} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" style={{ width: 154, height: 44, objectFit: "contain" }} />
  );
}

function PartnerStrip() {
  return (
    <div className="itinerary-partners">
      {Array.from({ length: 11 }, (_, i) => i + 1).map((n) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={n}
          src={`/partners/${n}.png`}
          alt=""
          style={{ height: 30, maxWidth: 64, objectFit: "contain", filter: "grayscale(1)" }}
        />
      ))}
    </div>
  );
}

const FlightIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={TEXT} strokeWidth={1.6}>
    <circle cx="12" cy="12" r="10" />
    <path d="M6.5 6.5l11 11M8 15l3-1 3 4 1-.5-1.5-4.5 3-1.5a1.3 1.3 0 00-1-2.4l-3 1.4L9 6.8l-1 .4 1.6 4-2.8 1-1.5-1-.8.3 1.2 2.2z" />
  </svg>
);

const Arrow = () => (
  <svg width="22" height="12" viewBox="0 0 24 14" fill="none" stroke={TEXT} strokeWidth={1.6}>
    <path d="M1 7h21M16 1l6 6-6 6" />
  </svg>
);

type DFFlight = OrderDetails["slices"][number]["flights"][number];

function FlightCard({ f, status }: { f: DFFlight; status: string }) {
  const airlineLabel = `${f.airline.toUpperCase()} (${f.airlineCode})`;
  const flightNumOnly = f.flightNumber.replace(f.airlineCode, "").replace(/^0+/, "") || f.flightNumber;

  return (
    <div className="itinerary-card">
      <div className="itinerary-card-head">
        <FlightIcon />
        <span style={{ fontSize: 15, fontWeight: 700 }}>
          FLIGHT - {airlineLabel} {flightNumOnly} - {f.departDate}
        </span>
      </div>

      <div className="itinerary-card-body">
        {/* Left column */}
        <div className="itinerary-col-left">
          <AirlineLogo src={f.logoSymbol} />
          <div style={{ marginTop: 12, fontSize: 14, fontWeight: 700, textAlign: "center" }}>
            {airlineLabel}
          </div>
          <div style={{ marginTop: 14, fontSize: 13, lineHeight: "20px" }}>
            <div>
              Flight number: <b>{f.airlineCode} - {flightNumOnly}</b>
            </div>
            <div>
              Status: <b>{status}</b>
            </div>
            <div>
              Duration: <b>{f.duration || "—"}</b>
            </div>
          </div>
        </div>

        {/* Middle column */}
        <div className="itinerary-col-mid">
          <div className="itinerary-legs">
            <div className="itinerary-leg">
              <div className="itinerary-leg-label">Depart</div>
              <div className="itinerary-leg-code">{f.from.code}</div>
              <div className="itinerary-leg-name">
                {nameLines(f.from.name).map((l) => (
                  <div key={l}>{l}</div>
                ))}
              </div>
              <div className="itinerary-leg-time">{f.departTime}</div>
              <div className="itinerary-leg-date">{f.departDate}</div>
            </div>

            <div className="itinerary-leg-arrow">
              <Arrow />
              <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4 }}>{f.duration || "—"}</div>
            </div>

            <div className="itinerary-leg">
              <div className="itinerary-leg-label">Arrive</div>
              <div className="itinerary-leg-code">{f.to.code}</div>
              <div className="itinerary-leg-name">
                {nameLines(f.to.name).map((l) => (
                  <div key={l}>{l}</div>
                ))}
              </div>
              <div className="itinerary-leg-time">{f.arriveTime}</div>
              <div className="itinerary-leg-date">{f.arriveDate}</div>
            </div>
          </div>
        </div>

        {/* Right column — gray panel */}
        <div className="itinerary-col-right">
          <div>Class Of Service:</div>
          <div className="itinerary-dim">{f.cabinClass ?? "Economy"}</div>
          <div style={{ marginTop: 8 }}>Plane:</div>
          <div className="itinerary-dim">{f.aircraft ?? "—"}</div>
          <div style={{ marginTop: 8 }}>Meals:</div>
          <div className="itinerary-dim">
            {MEALS.map((l) => (
              <div key={l}>{l}</div>
            ))}
          </div>
          <div style={{ marginTop: 8 }}>Seat:</div>
          <div className="itinerary-dim">Check-in required</div>
        </div>
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

  // Demo PNRs for the printable PDF — generated once per page load.
  const [demoCodes] = useState(() => ({
    reservation: randomReservationCode(),
    airline: randomAirlineReservationCode(),
  }));

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

  /* ============ Verified path — real Duffel order ============ */
  if (order) {
    const dest = order.destination;
    const destination = dest ? `${dest.city || dest.name} ${dest.code}`.trim() : "";

    return (
      <>
        <style>{`
          .itinerary-wrap {
            background: #f3f3f3;
            min-height: 100vh;
            padding: 24px 0;
            overflow-x: auto;
          }
          .itinerary-toolbar {
            width: 920px;
            margin: 0 auto 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .itinerary-page {
            width: 920px;
            min-height: 1300px;
            margin: 0 auto;
            background: #fff;
            color: ${TEXT};
            font-family: Poppins, Arial, sans-serif;
            padding: 48px 49px 40px 53px;
            box-sizing: border-box;
          }
          .itinerary-title {
            font-size: 22px;
            line-height: 25px;
            margin-bottom: 40px;
          }
          .itinerary-title small {
            font-size: 17px;
            text-transform: uppercase;
          }
          .itinerary-traveler {
            border: 1px solid ${BORDER};
            width: 818px;
            margin-bottom: 24px;
          }
          .itinerary-traveler-head {
            height: 42px;
            border-bottom: 1px solid ${BORDER};
            display: flex;
            align-items: center;
            padding-left: 8px;
            font-size: 17px;
            font-weight: 700;
          }
          .itinerary-traveler-body {
            display: flex;
            justify-content: space-between;
            padding: 10px 12px 14px;
            gap: 24px;
          }
          .itinerary-traveler-body .right {
            text-align: right;
            font-size: 14px;
            line-height: 20px;
          }

          /* FLIGHT CARD — fixed-width columns, no flex grow/shrink */
          .itinerary-card {
            border: 1px solid ${BORDER};
            width: 818px;
            margin-bottom: 24px;
            break-inside: avoid;
            page-break-inside: avoid;
          }
          .itinerary-card-head {
            height: 44px;
            border-bottom: 1px solid ${BORDER};
            display: flex;
            align-items: center;
            gap: 6px;
            padding-left: 8px;
          }
          .itinerary-card-body {
            display: flex;
            align-items: stretch;
            flex-wrap: nowrap;
          }
          .itinerary-col-left {
            width: 220px;
            flex: 0 0 220px;
            border-right: 1px solid ${BORDER};
            padding: 14px 12px;
            display: flex;
            flex-direction: column;
            align-items: center;
            box-sizing: border-box;
          }
          .itinerary-col-mid {
            width: 418px;
            flex: 0 0 418px;
            padding: 14px 16px;
            box-sizing: border-box;
          }
          .itinerary-col-right {
            width: 180px;
            flex: 0 0 180px;
            background: ${GREY_PANEL} !important;
            padding: 14px 12px;
            font-size: 13px;
            line-height: 17px;
            box-sizing: border-box;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .itinerary-dim { color: #444; }

          .itinerary-legs {
            display: flex;
            align-items: flex-start;
            gap: 12px;
          }
          .itinerary-leg {
            flex: 1;
            min-width: 0;
          }
          .itinerary-leg-arrow {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding-top: 26px;
            color: ${TEXT};
          }
          .itinerary-leg-label {
            font-size: 12px;
            text-transform: uppercase;
            color: #666;
            letter-spacing: 0.05em;
          }
          .itinerary-leg-code {
            font-size: 26px;
            font-weight: 700;
            line-height: 30px;
            margin-top: 2px;
          }
          .itinerary-leg-name {
            font-size: 12px;
            line-height: 15px;
            margin-top: 6px;
            color: #333;
          }
          .itinerary-leg-time {
            font-size: 20px;
            font-weight: 700;
            margin-top: 10px;
          }
          .itinerary-leg-date {
            font-size: 13px;
            color: #555;
          }

          .itinerary-partners {
            width: 818px;
            margin-top: 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 6px;
            break-inside: avoid;
          }

          /* ============== PRINT ============== */
          @media print {
            @page { size: A4; margin: 8mm; }

            body { background: #fff !important; }

            .itinerary-wrap {
              background: #fff !important;
              padding: 0 !important;
              overflow: visible !important;
            }
            .itinerary-toolbar,
            .itinerary-upsell,
            .print\\:hidden { display: none !important; }

            .itinerary-page {
              width: 100% !important;
              min-height: 0 !important;
              padding: 0 !important;
              margin: 0 !important;
            }
            .itinerary-card,
            .itinerary-traveler,
            .itinerary-partners {
              width: 100% !important;
              page-break-inside: avoid;
              break-inside: avoid;
            }

            /* Force fixed columns under print too */
            .itinerary-card-body {
              display: flex !important;
              flex-wrap: nowrap !important;
            }
            .itinerary-col-left,
            .itinerary-col-mid,
            .itinerary-col-right {
              flex-shrink: 0 !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        `}</style>

        <div className="itinerary-wrap">
          <div className="itinerary-toolbar print:hidden">
            <Link
              href={`/order?b=${encodeURIComponent(encoded)}`}
              style={{ fontSize: 13, color: "#0369a1", textDecoration: "underline" }}
            >
              ← Back to booking
            </Link>
            <button
              onClick={() => window.print()}
              style={{
                padding: "6px 16px",
                fontSize: 13,
                border: `1px solid ${TEXT}`,
                background: "#fff",
                cursor: "pointer",
              }}
            >
              Print / Save as PDF
            </button>
          </div>

          <div className="itinerary-page">
            <div className="itinerary-title">
              {order.tripDate ?? ""} <small>Trip to</small>
              <br />
              {destination}
            </div>

            <div className="itinerary-traveler">
              <div className="itinerary-traveler-head">TRAVELER(S)</div>
              <div className="itinerary-traveler-body">
                <div>
                  <div style={{ fontSize: 14, color: "#555" }}>Passenger(s)</div>
                  {order.passengers.map((p) => (
                    <div key={p} style={{ marginTop: 8, fontSize: 16, fontWeight: 700 }}>
                      {p}
                    </div>
                  ))}
                </div>
                <div className="right">
                  <div>Reservation Code</div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>
                    {demoCodes.reservation}
                  </div>
                  <div style={{ marginTop: 6 }}>Airline Reservation Code</div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>
                    {demoCodes.airline}
                  </div>
                </div>
              </div>
            </div>

            {order.slices.flatMap((slice, si) =>
              slice.flights.map((f, fi) => (
                <FlightCard key={`${si}-${fi}`} f={f} status={order.status} />
              )),
            )}

            <PartnerStrip />
          </div>

          <div
            className="itinerary-upsell print:hidden"
            style={{
              width: 920,
              margin: "24px auto 0",
              background: "#0b1f3a",
              color: "#fff",
              padding: 24,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 24,
            }}
          >
            <div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>Need a paid reservation?</div>
              <div style={{ marginTop: 4, fontSize: 14, color: "#cbd5e1" }}>
                Get a ticketed booking with an e-ticket number emailed as a PDF.
              </div>
            </div>
            <Link
              href={`/order?b=${encodeURIComponent(encoded)}`}
              style={{
                display: "inline-block",
                padding: "12px 24px",
                background: "#fff",
                color: "#0b1f3a",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Continue · {price}
            </Link>
          </div>
        </div>
      </>
    );
  }

  /* ============ Fallback — no Duffel order yet ============ */
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
              We advise you print out your itinerary and take it with you to ensure your trip goes as
              smoothly as possible.
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
                    <td className="px-4 py-3 font-mono">{demoCodes.reservation}</td>
                    <td className="px-4 py-3 font-mono">{demoCodes.airline}</td>
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
                              <td className="px-3 py-2 whitespace-nowrap">
                                {seg.departAt.replace("T", " ").slice(0, 16)}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap">
                                {seg.arriveAt.replace("T", " ").slice(0, 16)}
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

          <PartnerStrip />
        </article>
      </div>
    </div>
  );
}

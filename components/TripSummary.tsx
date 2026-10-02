"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  type BookingRequest,
  type FlightSegment,
  type Selection,
} from "@/lib/booking";
import type { getOrderDetails } from "@/lib/providers/duffel";
import { site } from "@/lib/site";
import { LogoMark } from "./Logo";
import { SELECTION_KEY } from "./SearchResults";

type OrderDetails = Awaited<ReturnType<typeof getOrderDetails>>;

/* ---------- Layout constants ---------- */
const BORDER = "#d4d4d4";
const GREY_PANEL = "#cccccc";
const TEXT = "#222222";

/* ---------- Split a name into 2-3 short lines for the PDF look ---------- */
const nameLines = (name: string): string[] => {
  const words = (name || "").split(/\s+/).filter(Boolean);
  if (words.length <= 2) return words;
  // Group into 3 lines max
  const per = Math.ceil(words.length / 3);
  const out: string[] = [];
  for (let i = 0; i < words.length; i += per) out.push(words.slice(i, i + per).join(" "));
  return out.slice(0, 3);
};

const MEALS = ["Drinks and quality", "products offered", "for sale"];

/* ---------- Airline logo (Duffel URL, hidden if missing) ---------- */
function AirlineLogo({ src }: { src?: string | null }) {
  if (!src) return <div style={{ height: 44 }} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      style={{ width: 154, height: 44, objectFit: "contain" }}
    />
  );
}

/* ---------- Partner logos strip ---------- */
function PartnerStrip() {
  return (
    <div
      style={{
        width: 818,
        marginTop: 24,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      {Array.from({ length: 11 }, (_, i) => i + 1).map((n) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={n}
          src={`/partners/${n}.png`}
          alt=""
          style={{ height: 32, maxWidth: 66, objectFit: "contain", filter: "grayscale(1)" }}
        />
      ))}
    </div>
  );
}

/* ---------- Flight icon ---------- */
const FlightIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={TEXT} strokeWidth={1.6}>
    <circle cx="12" cy="12" r="10" />
    <path d="M6.5 6.5l11 11M8 15l3-1 3 4 1-.5-1.5-4.5 3-1.5a1.3 1.3 0 00-1-2.4l-3 1.4L9 6.8l-1 .4 1.6 4-2.8 1-1.5-1-.8.3 1.2 2.2z" />
  </svg>
);

const Arrow = () => (
  <svg width="24" height="14" viewBox="0 0 24 14" fill="none" stroke={TEXT} strokeWidth={1.6}>
    <path d="M1 7h21M16 1l6 6-6 6" />
  </svg>
);

/* ---------- One flight card (pixel-locked layout) ---------- */
type DFFlight = OrderDetails["slices"][number]["flights"][number];

function FlightCard({ f, status }: { f: DFFlight; status: string }) {
  const airlineLabel = `${f.airline.toUpperCase()} (${f.airlineCode})`;
  const flightNumOnly = f.flightNumber.replace(f.airlineCode, "").replace(/^0+/, "") || f.flightNumber;
  const lbl: React.CSSProperties = { fontSize: 16, lineHeight: "18px" };

  return (
    <div style={{ border: `1px solid ${BORDER}`, width: 818 }}>
      {/* Header */}
      <div
        style={{
          height: 48,
          borderBottom: `1px solid ${BORDER}`,
          display: "flex",
          alignItems: "center",
          gap: 4,
          paddingLeft: 6,
        }}
      >
        <FlightIcon />
        <span style={{ fontSize: 17, fontWeight: 700 }}>
          FLIGHT - {airlineLabel} {flightNumOnly} - {f.departDate}
        </span>
      </div>

      {/* Body */}
      <div style={{ display: "flex", height: 295 }}>
        {/* Left column */}
        <div style={{ width: 236, borderRight: `1px solid ${BORDER}`, position: "relative" }}>
          <div style={{ position: "absolute", top: 54, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
            <AirlineLogo src={f.logoSymbol} />
          </div>
          <div
            style={{
              position: "absolute",
              top: 163,
              left: 0,
              right: 0,
              textAlign: "center",
              fontSize: 16,
              fontWeight: 700,
            }}
          >
            {airlineLabel}
          </div>
          <div style={{ position: "absolute", top: 201, left: 8, fontSize: 16, lineHeight: "27px" }}>
            <div>
              Flight number:&nbsp; <b>{f.airlineCode} - {flightNumOnly}</b>
            </div>
            <div>
              Status:&nbsp; <b style={{ fontSize: 17 }}>{status}</b>
            </div>
            <div>
              Duration:&nbsp; <b style={{ fontSize: 17 }}>{f.duration || "—"}</b>
            </div>
          </div>
        </div>

        {/* Middle column */}
        <div style={{ flex: 1, position: "relative" }}>
          <div style={{ position: "absolute", top: 52, left: 10, ...lbl }}>Depart</div>
          <div
            style={{
              position: "absolute",
              top: 74,
              left: 10,
              fontSize: 28,
              fontWeight: 700,
              lineHeight: "34px",
            }}
          >
            {f.from.code}
          </div>

          <div
            style={{
              position: "absolute",
              top: 58,
              left: 0,
              right: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Arrow />
            <div style={{ marginTop: 10, fontSize: 16, fontWeight: 700 }}>{f.duration || "—"}</div>
          </div>

          <div style={{ position: "absolute", top: 52, right: 8, textAlign: "right", ...lbl }}>Arrive</div>
          <div
            style={{
              position: "absolute",
              top: 74,
              right: 8,
              fontSize: 28,
              fontWeight: 700,
              lineHeight: "34px",
            }}
          >
            {f.to.code}
          </div>

          {/* Divider */}
          <div style={{ position: "absolute", top: 124, left: 0, right: 0, borderTop: `1px solid ${BORDER}` }} />

          {/* Depart details */}
          <div style={{ position: "absolute", top: 133, left: 10, ...lbl }}>
            {nameLines(f.from.name).map((l) => (
              <div key={l}>{l}</div>
            ))}
          </div>
          <div style={{ position: "absolute", top: 196, left: 10, fontSize: 26, fontWeight: 700 }}>
            {f.departTime}
          </div>
          <div style={{ position: "absolute", top: 228, left: 10, fontSize: 16 }}>{f.departDate}</div>

          {/* Arrive details */}
          <div style={{ position: "absolute", top: 133, left: 269, ...lbl }}>
            {nameLines(f.to.name).map((l) => (
              <div key={l}>{l}</div>
            ))}
          </div>
          <div style={{ position: "absolute", top: 196, left: 269, fontSize: 26, fontWeight: 700 }}>
            {f.arriveTime}
          </div>
          <div style={{ position: "absolute", top: 228, left: 269, fontSize: 16 }}>{f.arriveDate}</div>
        </div>

        {/* Grey details column */}
        <div
          style={{
            width: 183,
            background: GREY_PANEL,
            padding: "54px 12px 0",
            fontSize: 16,
            lineHeight: "17.5px",
          }}
        >
          <div>Class Of Service:</div>
          <div style={{ color: "#444" }}>{f.cabinClass ?? "Economy"}</div>
          <div style={{ marginTop: 9 }}>Plane:</div>
          <div style={{ color: "#444", minHeight: 9 }}>{f.aircraft ?? ""}</div>
          <div>Meals:</div>
          <div style={{ color: "#444" }}>
            {MEALS.map((l) => (
              <div key={l}>{l}</div>
            ))}
          </div>
          <div style={{ marginTop: 9 }}>Seat:</div>
          <div style={{ color: "#444" }}>Check-in required</div>
        </div>
      </div>

      {/* Bottom strip */}
      <div style={{ height: 38, borderTop: `1px solid ${BORDER}` }} />
    </div>
  );
}

/* ---------- Main component ---------- */
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
    const dest = order.destination;
    const destination = dest
      ? `${dest.city || dest.name} ${dest.code}`.trim()
      : "";

    return (
      <div style={{ background: "#f3f3f3", minHeight: "100vh", padding: "24px 0", overflowX: "auto" }}>
        {/* Toolbar (hidden on print) */}
        <div
          className="print:hidden"
          style={{
            width: 920,
            margin: "0 auto 16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
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

        {/* Page */}
        <div
          style={{
            width: 920,
            minHeight: 1300,
            margin: "0 auto",
            background: "#fff",
            color: TEXT,
            fontFamily: "Poppins, Arial, sans-serif",
            padding: "48px 49px 40px 53px",
            boxSizing: "border-box",
          }}
        >
          {/* Title */}
          <div style={{ fontSize: 22, lineHeight: "25px", marginBottom: 58 }}>
            {order.tripDate ?? ""}{" "}
            <span style={{ fontSize: 17, textTransform: "uppercase" }}>Trip to</span>
            <br />
            {destination}
          </div>

          {/* Traveler box */}
          <div style={{ border: `1px solid ${BORDER}`, width: 818, marginBottom: 24 }}>
            <div
              style={{
                height: 42,
                borderBottom: `1px solid ${BORDER}`,
                display: "flex",
                alignItems: "center",
                paddingLeft: 8,
                fontSize: 17,
                fontWeight: 700,
              }}
            >
              TRAVELER(S)
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 8px 10px" }}>
              <div>
                <div style={{ fontSize: 16 }}>Passenger(s)</div>
                {order.passengers.map((p) => (
                  <div key={p} style={{ marginTop: 16, fontSize: 17, fontWeight: 700 }}>
                    {p}
                  </div>
                ))}
              </div>
              <div style={{ textAlign: "right", fontSize: 16, lineHeight: "21px" }}>
                <div>Reservation Code</div>
                <div style={{ fontWeight: 700 }}>{order.airlineBookingReference}</div>
                <div>Airline Reservation Code</div>
                <div style={{ fontWeight: 700, paddingRight: 4 }}>{order.airlineBookingReference}</div>
              </div>
            </div>
          </div>

          {/* Flight cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {order.slices.flatMap((slice, si) =>
              slice.flights.map((f, fi) => (
                <FlightCard key={`${si}-${fi}`} f={f} status={order.status} />
              )),
            )}
          </div>

          {/* Footer logos */}
          <PartnerStrip />
        </div>

        {/* Upsell (hidden on print) */}
        <div
          className="print:hidden"
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
    );
  }

  /* ---------- Fallback: no Duffel order yet ---------- */
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

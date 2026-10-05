"use client";
 
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  type BookingRequest,
  type Selection,
} from "@/lib/booking";
import { site } from "@/lib/site";

 type OrderDetails = {
  orderId: string;
  airlineBookingReference: string;
  status: string;
  payBy: string | null;
  airline: { name: string; code: string; logoSymbol: string | null; logoLockup: string | null };
  passengers: string[];
  tripDate: string | null;
  destination: { code: string; name: string; city: string | null } | null;
  slices: {
    from: { code: string; name: string; city: string | null };
    to: { code: string; name: string; city: string | null };
    date: string;
    duration: string;
    flights: {
      airline: string;
      airlineCode: string;
      logoSymbol: string | null;
      logoLockup: string | null;
      operatedBy: string;
      flightNumber: string;
      from: { code: string; name: string; city: string | null };
      to: { code: string; name: string; city: string | null };
      departDate: string;
      departTime: string;
      arriveDate: string;
      arriveTime: string;
      duration: string;
      cabinClass: string | null;
      aircraft: string | null;
      connection: {
        airport: { code: string; name: string; city: string | null };
        wait: string;
      } | null;
    }[];
  }[];
};

const BORDER = "#d4d4d4";
const GREY_PANEL = "#cccccc";
const TEXT = "#222222";

// --- random code helpers, self-contained ---
const ALPHANUM = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const DIGITS = "0123456789";
const ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const pick = (a: string, n: number) =>
  Array.from({ length: n }, () => a[Math.floor(Math.random() * a.length)]).join("");
const randomReservationCode = () => pick(ALPHANUM, 6);
const randomAirlineReservationCode = () => pick(DIGITS, 13) + pick(ALPHA, 1) + pick(DIGITS, 1);

const nameLines = (name: string): string[] => {
  const words = (name || "").split(/\s+/).filter(Boolean);
  if (words.length <= 2) return words;
  const per = Math.ceil(words.length / 3);
  const out: string[] = [];
  for (let i = 0; i < words.length; i += per) out.push(words.slice(i, i + per).join(" "));
  return out.slice(0, 3);
};

const shortCity = (label: string): string => {
  const dash = label.indexOf(" - ");
  return (dash > 0 ? label.slice(0, dash) : label).trim();
};

const dateOf = (iso: string) => (iso || "").slice(0, 10);
const timeOf = (iso: string) => (iso || "").slice(11, 16);

const MEALS = ["Drinks and quality", "products offered", "for sale"];

type Seg = NonNullable<Selection["segments"]>[number] & { logo?: string | null };

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

function AirlineLogo({ code, src }: { code: string; src?: string | null }) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        style={{ width: 154, height: 44, objectFit: "contain" }}
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
    );
  }
  return (
    <div
      style={{
        width: 120,
        height: 44,
        background: "#0b1f3a",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 20,
        fontWeight: 700,
        letterSpacing: 1,
        borderRadius: 4,
      }}
    >
      {code}
    </div>
  );
}

function SegmentCard({ seg }: { seg: Seg }) {
  const flightNumOnly = seg.flightNumber.replace(/^[A-Z0-9]{2}/, "").replace(/^0+/, "") || seg.flightNumber;
  const airlineCode = seg.flightNumber.slice(0, 2);
  const airlineLabel = `${(seg.airline || "").toUpperCase()} (${airlineCode})`;

  return (
    <div className="itinerary-card">
      <div className="itinerary-card-head">
        <FlightIcon />
        <span style={{ fontSize: 15, fontWeight: 700 }}>
          FLIGHT - {airlineLabel} {flightNumOnly} - {dateOf(seg.departAt)}
        </span>
      </div>

      <div className="itinerary-card-body">
        <div className="itinerary-col-left">
          <AirlineLogo code={airlineCode} src={seg.logo ?? null} />
          <div style={{ marginTop: 12, fontSize: 14, fontWeight: 700, textAlign: "center" }}>
            {airlineLabel}
          </div>
          <div style={{ marginTop: 14, fontSize: 13, lineHeight: "20px" }}>
            <div>
              Flight number: <b>{airlineCode} - {flightNumOnly}</b>
            </div>
            <div>
              Status: <b>On hold (awaiting payment)</b>
            </div>
            {seg.operatedBy && seg.operatedBy !== seg.airline ? (
              <div>
                Operated by: <b>{seg.operatedBy}</b>
              </div>
            ) : null}
          </div>
        </div>

        <div className="itinerary-col-mid">
          <div className="itinerary-legs">
            <div className="itinerary-leg">
              <div className="itinerary-leg-label">Depart</div>
              <div className="itinerary-leg-code">{seg.from}</div>
              <div className="itinerary-leg-name">
                {nameLines(seg.fromName).map((l) => (
                  <div key={l}>{l}</div>
                ))}
              </div>
              <div className="itinerary-leg-time">{timeOf(seg.departAt)}</div>
              <div className="itinerary-leg-date">{dateOf(seg.departAt)}</div>
            </div>

            <div className="itinerary-leg-arrow">
              <Arrow />
            </div>

            <div className="itinerary-leg">
              <div className="itinerary-leg-label">Arrive</div>
              <div className="itinerary-leg-code">{seg.to}</div>
              <div className="itinerary-leg-name">
                {nameLines(seg.toName).map((l) => (
                  <div key={l}>{l}</div>
                ))}
              </div>
              <div className="itinerary-leg-time">{timeOf(seg.arriveAt)}</div>
              <div className="itinerary-leg-date">{dateOf(seg.arriveAt)}</div>
            </div>
          </div>
        </div>

        <div className="itinerary-col-right">
          <div>Class Of Service:</div>
          <div className="itinerary-dim">Economy</div>
          <div style={{ marginTop: 8 }}>Plane:</div>
          <div className="itinerary-dim">—</div>
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
}: {
  booking: BookingRequest;
  encoded: string;
  price: string;
  order?: OrderDetails | null;
}) {
  const [selections, setSelections] = useState<Selection[] | null | undefined>(undefined);
  const [demoCodes] = useState(() => ({
    reservation: randomReservationCode(),
    airline: randomAirlineReservationCode(),
  }));

  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem("booking-selections") || "null");
      setSelections(saved?.booking === encoded ? saved.selections : null);
    } catch {
      setSelections(null);
    }
  }, [encoded]);

  if (selections === undefined) return null;
  if (!selections || selections.length === 0) {
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

  const segments: Seg[] = selections.flatMap((s) => (s.segments ?? []) as Seg[]);

  const legs = booking.legs ?? [];
  const legDests = legs.map((l) => l.toCode);
  const grouped: Seg[][] = [];
  let current: Seg[] = [];
  for (const seg of segments) {
    current.push(seg);
    const target = legDests[grouped.length];
    if (target && seg.to === target && grouped.length < legDests.length - 1) {
      grouped.push(current);
      current = [];
    }
  }
  if (current.length) grouped.push(current);

  const legTitles = legs.map((l) => ({ date: l.date, city: shortCity(l.to) }));

  return (
    <>
      <style>{`
        .itinerary-wrap { background:#f3f3f3; min-height:100vh; padding:24px 0; overflow-x:auto; }
        .itinerary-toolbar { width:920px; margin:0 auto 16px; display:flex; justify-content:space-between; align-items:center; }
        .itinerary-page { width:920px; min-height:1300px; margin:0 auto; background:#fff; color:${TEXT}; font-family:Poppins, Arial, sans-serif; padding:48px 49px 40px 53px; box-sizing:border-box; }
        .itinerary-title { font-size:22px; line-height:25px; margin-bottom:40px; }
        .itinerary-title small { font-size:17px; text-transform:uppercase; }
        .itinerary-title .trip-line { margin-bottom: 12px; }
        .itinerary-traveler { border:1px solid ${BORDER}; width:818px; margin-bottom:24px; }
        .itinerary-traveler-head { height:42px; border-bottom:1px solid ${BORDER}; display:flex; align-items:center; padding-left:8px; font-size:17px; font-weight:700; }
        .itinerary-traveler-body { display:flex; justify-content:space-between; padding:10px 12px 14px; gap:24px; }
        .itinerary-traveler-body .right { text-align:right; font-size:14px; line-height:20px; }
        .itinerary-card { border:1px solid ${BORDER}; width:818px; margin-bottom:24px; break-inside:avoid; page-break-inside:avoid; }
        .itinerary-card-head { min-height:44px; border-bottom:1px solid ${BORDER}; display:flex; align-items:center; gap:6px; padding:8px; }
        .itinerary-card-body { display:flex; align-items:stretch; flex-wrap:nowrap; }
        .itinerary-col-left { width:220px; flex:0 0 220px; border-right:1px solid ${BORDER}; padding:14px 12px; display:flex; flex-direction:column; align-items:center; box-sizing:border-box; }
        .itinerary-col-mid { width:418px; flex:0 0 418px; padding:14px 16px; box-sizing:border-box; }
        .itinerary-col-right { width:180px; flex:0 0 180px; background:${GREY_PANEL} !important; padding:14px 12px; font-size:13px; line-height:17px; box-sizing:border-box; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
        .itinerary-dim { color:#444; }
        .itinerary-legs { display:flex; align-items:flex-start; gap:12px; }
        .itinerary-leg { flex:1; min-width:0; }
        .itinerary-leg-arrow { display:flex; flex-direction:column; align-items:center; padding-top:26px; color:${TEXT}; }
        .itinerary-leg-label { font-size:12px; text-transform:uppercase; color:#666; letter-spacing:0.05em; }
        .itinerary-leg-code { font-size:26px; font-weight:700; line-height:30px; margin-top:2px; }
        .itinerary-leg-name { font-size:12px; line-height:15px; margin-top:6px; color:#333; }
        .itinerary-leg-time { font-size:20px; font-weight:700; margin-top:10px; }
        .itinerary-leg-date { font-size:13px; color:#555; }
        .itinerary-partners { width:818px; margin-top:24px; display:flex; justify-content:space-between; align-items:center; gap:6px; break-inside:avoid; }
        @media print {
          @page { size:A4; margin:8mm; }
          body { background:#fff !important; }
          .itinerary-wrap { background:#fff !important; padding:0 !important; overflow:visible !important; }
          .itinerary-toolbar, .itinerary-upsell, .print\\:hidden { display:none !important; }
          .itinerary-page { width:100% !important; min-height:0 !important; padding:0 !important; margin:0 !important; }
          .itinerary-card, .itinerary-traveler, .itinerary-partners { width:100% !important; page-break-inside:avoid; break-inside:avoid; }
          .itinerary-card-body { display:flex !important; flex-wrap:nowrap !important; }
          .itinerary-col-left, .itinerary-col-mid, .itinerary-col-right { flex-shrink:0 !important; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
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
            style={{ padding: "6px 16px", fontSize: 13, border: `1px solid ${TEXT}`, background: "#fff", cursor: "pointer" }}
          >
            Print / Save as PDF
          </button>
        </div>

        <div className="itinerary-page">
          <div className="itinerary-title">
            {legTitles.map((t, i) => (
              <div key={i} className="trip-line">
                {t.date} <small>Trip to</small>
                <br />
                {t.city}
              </div>
            ))}
          </div>

          <div className="itinerary-traveler">
            <div className="itinerary-traveler-head">TRAVELER(S)</div>
            <div className="itinerary-traveler-body">
              <div>
                <div style={{ fontSize: 14, color: "#555" }}>Passenger(s)</div>
                <div style={{ marginTop: 8, fontSize: 16, fontWeight: 700 }}>MR SHOAIB IRFAN</div>
              </div>
              <div className="right">
                <div>Reservation Code</div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{demoCodes.reservation}</div>
                <div style={{ marginTop: 6 }}>Airline Reservation Code</div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{demoCodes.airline}</div>
              </div>
            </div>
          </div>

          {grouped.map((legSegs, legIndex) => (
            <div key={legIndex} style={{ marginBottom: 16 }}>
              {legSegs.map((seg, i) => (
                <SegmentCard key={`${legIndex}-${i}`} seg={seg} />
              ))}
            </div>
          ))}

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

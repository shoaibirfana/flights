"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  type BookingRequest,
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

/** "Karachi (KHI) - Jinnah International Airport, Pakistan" → "Karachi (KHI)" */
const shortCity = (label: string): string => {
  const dash = label.indexOf(" - ");
  return (dash > 0 ? label.slice(0, dash) : label).trim();
};

const dateOf = (iso: string) => (iso || "").slice(0, 10);
const timeOf = (iso: string) => (iso || "").slice(11, 16);

const MEALS = ["Drinks and quality", "products offered", "for sale"];

type Seg = NonNullable<Selection["segments"]>[number];

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
          // If the URL fails to load, hide the image — the code badge below will show.
          e.currentTarget.style.display = "none";
        }}
      />
    );
  }
  // Fallback: a small colored box with the airline's IATA code
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
          <AirlineLogo code={airlineCode} src={seg.logo} />
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
              <div className="itiner

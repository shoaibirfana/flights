"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BOOKING_REF_KEY } from "./BookingReference";
import { SELECTION_KEY } from "./SearchResults";

// Links to the free trip summary for the flight picked in this browser tab, if there is one.
export default function TripSummaryLink() {
  const [encoded, setEncoded] = useState<string | null>(null);
  const [duffelOrderId, setDuffelOrderId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(SELECTION_KEY) || "null");
      if (typeof saved?.booking === "string" && saved.selections?.length) {
        setEncoded(saved.booking);
      }
      const ref = JSON.parse(sessionStorage.getItem(BOOKING_REF_KEY) || "null");
      if (typeof ref?.duffelOrderId === "string" && /^ord_[A-Za-z0-9]+$/.test(ref.duffelOrderId)) {
        setDuffelOrderId(ref.duffelOrderId);
      }
    } catch {
      // Storage unavailable; no link.
    }
  }, []);

  if (!encoded) return null;

  const href = `/order/summary?b=${encodeURIComponent(encoded)}${
    duffelOrderId ? `&o=${encodeURIComponent(duffelOrderId)}` : ""
  }`;

  return (
    <Link href={href} className="btn-outline">
      View trip summary (PDF)
    </Link>
  );
}

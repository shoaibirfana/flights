"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SELECTION_KEY } from "./SearchResults";

// Links to the free trip summary for the flight/hotel picked in this browser tab, if there is one.
export default function TripSummaryLink() {
  const [encoded, setEncoded] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(SELECTION_KEY) || "null");
      if (typeof saved?.booking === "string" && saved.selections?.length) setEncoded(saved.booking);
    } catch {
      // Storage unavailable; no link.
    }
  }, []);

  if (!encoded) return null;
  return (
    <Link href={`/order/summary?b=${encodeURIComponent(encoded)}`} className="btn-outline">
      View trip summary (PDF)
    </Link>
  );
}

"use client";

import { useEffect, useState } from "react";

export const BOOKING_REF_KEY = "booking-reference";

function formatDeadline(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

// The airline booking reference (PNR) of the flight hold order.
export default function BookingReference({ pnr, holdUntil }: { pnr: string; holdUntil?: string | null }) {
  const deadline = formatDeadline(holdUntil);
  return (
    <div className="mt-6 rounded-2xl border border-gray-200 bg-cream/40 p-5 text-left">
      <p className="mb-4 text-sm text-gray-700">
        We advise you to print this page and take it with you to ensure your trip goes as smoothly as possible.
      </p>
      <div className="text-xs font-medium tracking-wide text-gray-500 uppercase">Airline booking reference (PNR)</div>
      <div className="mt-1 font-mono text-3xl font-semibold tracking-widest text-navy-900">{pnr}</div>
      <p className="mt-2 text-sm text-gray-600">
        Your flight is reserved on hold{deadline ? ` until ${deadline}` : ""}. You can check it on the airline&apos;s
        website under &quot;Manage booking&quot; with this reference and your last name.
      </p>
      <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
        <strong>This is a reservation only, not a paid ticket.</strong> It was created to secure your seat for your
        visa application. The airline cancels it automatically{deadline ? ` after ${deadline}` : " at its deadline"}{" "}
        unless it is paid. To confirm and ticket this booking, contact us before then.
      </p>
    </div>
  );
}

// Shows the reference returned by the order API (orders without an online payment step).
export function StoredBookingReference({ orderId }: { orderId: string }) {
  const [ref, setRef] = useState<{ pnr: string; holdUntil: string | null } | null>(null);
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(BOOKING_REF_KEY) || "null");
      if (saved?.orderId === orderId && saved.pnr) setRef(saved);
    } catch {
      // Storage unavailable: the reference is still in the confirmation email.
    }
  }, [orderId]);
  return ref ? <BookingReference pnr={ref.pnr} holdUntil={ref.holdUntil} /> : null;
}

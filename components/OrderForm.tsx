"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { BookingRequest, Selection, Traveler } from "@/lib/booking";
import { BOOKING_REF_KEY } from "./BookingReference";
import { SELECTION_KEY } from "./SearchResults";

export const TRAVELERS_KEY = "booking-travelers";

const emptyTraveler = (): Traveler => ({ firstName: "", lastName: "" });

export default function OrderForm({
  booking,
  encoded,
  payLabel,
}: {
  booking: BookingRequest;
  encoded: string;
  // Button text when online payment is on (e.g. "Pay $12 →"); null when orders are submitted without payment
  payLabel: string | null;
}) {
  const [selections, setSelections] = useState<Selection[] | null | undefined>(undefined);
  const [travelers, setTravelers] = useState<Traveler[]>(() =>
    Array.from({ length: booking.travelers }, emptyTraveler),
  );
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // The flight picked on the results page is kept in sessionStorage for this booking.
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(SELECTION_KEY) || "null");
      setSelections(saved?.booking === encoded ? saved.selections : null);
    } catch {
      setSelections(null);
    }
  }, [encoded]);

  const update = (i: number, patch: Partial<Traveler>) =>
    setTravelers(travelers.map((t, idx) => (idx === i ? { ...t, ...patch } : t)));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!agree) return setError("Please accept the Terms & Conditions to continue.");
    setLoading(true);
    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking, selections, travelers, contact: { email, phone } }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
      if (data.checkoutUrl) {
        // Stripe's payment page; the selection stays saved for a retry and for the trip summary.
        sessionStorage.setItem(
          TRAVELERS_KEY,
          JSON.stringify({ booking: encoded, travelers }),
        );
        window.location.assign(data.checkoutUrl);
        return;
      }

      // Save the traveler names so the trip summary can show the passengers.
      sessionStorage.setItem(
        TRAVELERS_KEY,
        JSON.stringify({ booking: encoded, travelers }),
      );

      // The selection stays saved so the success page can link to the trip summary.
      if (data.pnr || data.duffelOrderId) {
        sessionStorage.setItem(
          BOOKING_REF_KEY,
          JSON.stringify({
            orderId: data.orderId,
            pnr: data.pnr ?? null,
            holdUntil: data.holdUntil ?? null,
            duffelOrderId: data.duffelOrderId ?? null,
          }),
        );
      }
      window.location.assign(`/order/success?id=${encodeURIComponent(data.orderId)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  // Airlines need date of birth and gender to reserve a seat as a hold order.
  const needsHoldDetails = Boolean(selections?.some((sel) => sel.hold));

  if (selections === undefined) return null;
  if (!selections) {
    return (
      <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
        <p className="text-gray-700">Please choose your {booking.service} from the search results first.</p>
        <Link href={`/search?b=${encodeURIComponent(encoded)}`} className="btn-primary mt-4">
          View results
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
        <h3 className="mb-3 font-semibold">Your Selection</h3>
        <div className="space-y-4">
          {selections.map((s) => (
            <ul key={s.ref} className="space-y-1 text-sm text-gray-700">
              {(s.display ?? s.summary).map((l, i) => (
                <li key={i} className={i === 0 ? "font-semibold text-navy-900" : ""}>
                  {l}
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
      {travelers.map((t, i) => (
        <div key={i} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <h3 className="mb-4 font-semibold">Traveler {i + 1}</h3>
          <div className="grid gap-4 md:grid-cols-12">
            <div className="md:col-span-6">
              <label className="label">
                First / Given Name (as on passport) <span className="text-red-600">*</span>
              </label>
              <input
                required
                className="input"
                value={t.firstName}
                onChange={(e) => update(i, { firstName: e.target.value })}
              />
            </div>
            <div className="md:col-span-6">
              <label className="label">
                Last / Surname (as on passport) <span className="text-red-600">*</span>
              </label>
              <input
                required
                className="input"
                value={t.lastName}
                onChange={(e) => update(i, { lastName: e.target.value })}
              />
            </div>
            {needsHoldDetails && (
              <>
                <div className="md:col-span-6">
                  <label className="label">Date of Birth</label>
                  <input
                    required
                    type="date"
                    className="input"
                    max={new Date().toISOString().slice(0, 10)}
                    value={t.bornOn ?? ""}
                    onChange={(e) => update(i, { bornOn: e.target.value })}
                  />
                </div>
                <div className="md:col-span-6">
                  <label className="label">Gender</label>
                  <select
                    required
                    className="input"
                    value={t.gender ?? ""}
                    onChange={(e) => update(i, { gender: e.target.value as "m" | "f" })}
                  >
                    <option value="">Select</option>
                    <option value="m">Male</option>
                    <option value="f">Female</option>
                  </select>
                </div>
              </>
            )}
          </div>
        </div>
      ))}

      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
        <h3 className="mb-4 font-semibold">Contact Details</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label">
              Email (we send your booking reference here) <span className="text-red-600">*</span>
            </label>
            <input required type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          {needsHoldDetails && (
            <div>
              <label className="label">Phone / WhatsApp</label>
              <input
                required
                type="tel"
                className="input"
                placeholder="+92 3xx xxxxxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          )}
        </div>
        <label className="mt-4 flex items-start gap-2 text-sm text-gray-700">
          <input type="checkbox" className="mt-1 accent-brand-600" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
          <span>
            <span className="text-red-600">*</span> I understand this is a reservation for visa purposes, not a paid ticket, and I agree to the{" "}
            <a href="/terms" target="_blank" className="text-brand-600 underline">
              Terms &amp; Conditions
            </a>{" "}
            and{" "}
            <a href="/refund-policy" target="_blank" className="text-brand-600 underline">
              Refund Policy
            </a>
            .
          </span>
        </label>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={loading} className="btn-primary w-full md:w-auto md:px-12">
        {loading ? (payLabel ? "Opening secure payment…" : "Submitting…") : payLabel ?? "Submit Order →"}
      </button>
    </form>
  );
}

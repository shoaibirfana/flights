"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { BookingRequest, Selection, Traveler } from "@/lib/booking";
import { SELECTION_KEY } from "./SearchResults";

const emptyTraveler = (): Traveler => ({ title: "Mr", firstName: "", lastName: "", nationality: "" });

export default function OrderForm({
  booking,
  encoded,
  payLabel,
}: {
  booking: BookingRequest;
  encoded: string;
  // Button text when online payment is on (e.g. "Pay $15 →"); null when orders are submitted without payment
  payLabel: string | null;
}) {
  const [selections, setSelections] = useState<Selection[] | null | undefined>(undefined);
  const [travelers, setTravelers] = useState<Traveler[]>(() =>
    Array.from({ length: booking.travelers }, emptyTraveler),
  );
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // The flight/hotel picked on the results page is kept in sessionStorage for this booking.
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
        body: JSON.stringify({ booking, selections, travelers, contact: { email, phone, notes } }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
      if (data.checkoutUrl) {
        // Stripe's payment page; the selection stays saved in case the customer comes back to retry.
        window.location.assign(data.checkoutUrl);
        return;
      }
      sessionStorage.removeItem(SELECTION_KEY);
      window.location.assign(`/order/success?id=${encodeURIComponent(data.orderId)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

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
              {s.summary.map((l, i) => (
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
            <div className="md:col-span-2">
              <label className="label">Title</label>
              <select className="input" value={t.title} onChange={(e) => update(i, { title: e.target.value })}>
                {["Mr", "Mrs", "Ms", "Miss", "Master"].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-5">
              <label className="label">First / Given Name</label>
              <input
                required
                className="input"
                value={t.firstName}
                onChange={(e) => update(i, { firstName: e.target.value })}
              />
            </div>
            <div className="md:col-span-5">
              <label className="label">Last / Surname</label>
              <input
                required
                className="input"
                value={t.lastName}
                onChange={(e) => update(i, { lastName: e.target.value })}
              />
            </div>
            <div className="md:col-span-6">
              <label className="label">Nationality</label>
              <input
                required
                className="input"
                placeholder="e.g. Pakistani"
                value={t.nationality}
                onChange={(e) => update(i, { nationality: e.target.value })}
              />
            </div>
          </div>
        </div>
      ))}

      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
        <h3 className="mb-4 font-semibold">Contact Details</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label">Email (we send your PDF here)</label>
            <input required type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
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
          <div className="md:col-span-2">
            <label className="label">Notes (optional)</label>
            <textarea
              rows={3}
              className="input"
              placeholder="Preferred airline, visa appointment date, anything else we should know"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
        <label className="mt-4 flex items-start gap-2 text-sm text-gray-700">
          <input type="checkbox" className="mt-1 accent-brand-600" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
          <span>
            I understand this is a reservation for visa purposes, not a paid ticket, and I agree to the{" "}
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

"use client";

import { useEffect, useState } from "react";
import type { BookingRequest, Selection } from "@/lib/booking";
import type { FlightOffer } from "@/lib/providers/liteapi-flights";
import SearchLoader from "./SearchLoader";

export const SELECTION_KEY = "booking-selections";

const day = (iso: string) =>
  new Date(iso.slice(0, 10) + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" });
// Airport-local time from the ISO string ("2026-10-16T09:55:00" → "09:55")
const time = (iso: string) => iso.slice(11, 16);

function useSearch<T>(url: string, body: unknown) {
  const [state, setState] = useState<{ loading: boolean; error: string; offers: T[] }>({
    loading: true,
    error: "",
    offers: [],
  });
  const key = JSON.stringify(body);
  useEffect(() => {
    const ctrl = new AbortController();
    setState({ loading: true, error: "", offers: [] });
    fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: key, signal: ctrl.signal })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (res.status === 504) throw new Error("The airline systems took too long to answer. Please search again.");
        if (!res.ok) throw new Error(data.error || "Search failed. Please try again.");
        setState({ loading: false, error: "", offers: data.offers });
      })
      .catch((e) => {
        if (!ctrl.signal.aborted) setState({ loading: false, error: e.message || "Search failed", offers: [] });
      });
    return () => ctrl.abort();
  }, [url, key]);
  return state;
}

function Status({
  loading,
  error,
  empty,
}: {
  loading: boolean;
  error: string;
  empty: boolean;
}) {
  if (loading) return <SearchLoader />;
  if (error) return <div className="rounded-2xl bg-red-50 p-6 text-red-700">{error}</div>;
  if (empty)
    return (
      <div className="rounded-2xl bg-white p-8 text-center text-gray-600 shadow-sm">
        No flights found for this search. Try different dates or nearby airports.
      </div>
    );
  return null;
}

function FlightResults({ booking, onSelect }: { booking: BookingRequest; onSelect: (s: Selection[]) => void }) {
  const { loading, error, offers } = useSearch<FlightOffer>("/api/flights", booking);
  const [stops, setStops] = useState<"all" | 0 | 1 | 2>("all");

  const group = (o: FlightOffer) => Math.min(o.maxStops, 2);
  const filters = [
    { key: "all" as const, label: "All", count: offers.length },
    { key: 0 as const, label: "Direct", count: offers.filter((o) => group(o) === 0).length },
    { key: 1 as const, label: "1 stop", count: offers.filter((o) => group(o) === 1).length },
    { key: 2 as const, label: "2+ stops", count: offers.filter((o) => group(o) === 2).length },
  ];
  const shown = stops === "all" ? offers : offers.filter((o) => group(o) === stops);

  return (
    <div className="space-y-4">
      <Status loading={loading} error={error} empty={offers.length === 0} />
      {!loading && offers.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {filters.map((f) => (
            <button
              key={f.label}
              disabled={f.count === 0}
              onClick={() => setStops(f.key)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
                stops === f.key ? "border-brand-600 bg-brand-600 text-white" : "border-gray-300 bg-white text-gray-700 hover:border-brand-600"
              }`}
            >
              {f.label} ({f.count})
            </button>
          ))}
          <span className="ml-auto text-sm text-gray-500">Direct flights first</span>
        </div>
      )}
      {shown.map((o, i) => (
        <div
          key={o.id}
          className="result-in card-lift rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100"
          style={{ animationDelay: `${Math.min(i, 10) * 50}ms` }}
        >
          <div className="flex flex-col gap-5 md:flex-row md:items-center">
            <div className="flex items-center gap-3 md:w-48">
              {o.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={o.logo} alt="" className="h-10 w-10 object-contain" />
              ) : (
                <span className="flex h-10 w-10 items-center justify-center rounded bg-brand-50 text-xs font-bold text-brand-600">
                  {o.airlineCode}
                </span>
              )}
              <span className="font-semibold">{o.airline}</span>
            </div>
            <div className="flex-1 space-y-3">
              {o.slices.map((s, i) => {
                const first = s.segments[0];
                const last = s.segments[s.segments.length - 1];
                return (
                  <div key={i} className="grid grid-cols-3 items-center gap-2 text-center">
                    <div>
                      <div className="text-lg font-bold">{s.from}</div>
                      <div className="text-base font-semibold text-navy-900">{time(first.departAt)}</div>
                      <div className="text-xs text-gray-500">{day(first.departAt)}</div>
                    </div>
                    <div className="text-xs text-gray-500">
                      <div>{s.duration}</div>
                      <div className="my-1 h-px bg-gray-300" />
                      <div className={s.stops.length === 0 ? "font-semibold text-green-600" : ""}>
                        {s.stops.length === 0
                          ? "Direct"
                          : `${s.stops.length} ${s.stops.length === 1 ? "stop" : "stops"} via ${s.stops.join(", ")}`}
                      </div>
                    </div>
                    <div>
                      <div className="text-lg font-bold">{s.to}</div>
                      <div className="text-base font-semibold text-navy-900">{time(last.arriveAt)}</div>
                      <div className="text-xs text-gray-500">{day(last.arriveAt)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-end md:w-32">
              <button
                className="btn-primary !px-5 !py-2 text-sm"
                onClick={() =>
                  onSelect([
                    {
                      ref: o.provider === "duffel" ? `Duffel offer ${o.id}` : `LiteAPI flight offer ${o.id}`,
                      ...(o.provider === "duffel" && o.passengerIds
                        ? { hold: { offerId: o.id, passengerIds: o.passengerIds } }
                        : {}),
                      // What the customer sees: no flight numbers or times until the reservation is made
                      display: [
                        o.airline,
                        ...o.slices.map(
                          (s) =>
                            `${s.from} → ${s.to} on ${day(s.segments[0].departAt)}, ${
                              s.stops.length ? `${s.stops.length} ${s.stops.length === 1 ? "stop" : "stops"}` : "direct"
                            }`,
                        ),
                      ],
                      // Full details for the team (order email)
                      summary: [
                        `${o.airline}: ${o.slices.map((s) => s.segments.map((g) => g.flightNumber).join("+")).join(" / ")}`,
                        ...o.slices.map(
                          (s) =>
                            `${s.from} → ${s.to}  ${s.segments[0].departAt.replace("T", " ").slice(0, 16)}${
                              s.stops.length ? ` (via ${s.stops.join(", ")})` : ""
                            }`,
                        ),
                      ],
                      // Full per-segment detail used by the printable trip summary.
                      // `logo` is taken from the segment itself (each flight has its own airline logo).
                      segments: o.slices.flatMap((s) =>
                        s.segments.map((g) => ({
                          flightNumber: g.flightNumber,
                          airline: g.carrier,
                          from: g.from,
                          fromName: g.fromName,
                          to: g.to,
                          toName: g.toName,
                          departAt: g.departAt,
                          arriveAt: g.arriveAt,
                          operatedBy: g.operatedBy !== g.carrier ? g.operatedBy : undefined,
                          logo: g.logo ?? o.logo ?? null,
                        })),
                      ),
                    },
                  ])
                }
              >
                Select
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SearchResults({ booking, encoded }: { booking: BookingRequest; encoded: string }) {
  const proceed = (selections: Selection[]) => {
    try {
      sessionStorage.setItem(SELECTION_KEY, JSON.stringify({ booking: encoded, selections }));
    } catch {
      // Storage unavailable; the order page will ask the customer to search again.
    }
    window.location.assign(`/order?b=${encodeURIComponent(encoded)}`);
  };

  return <FlightResults booking={booking} onSelect={proceed} />;
}

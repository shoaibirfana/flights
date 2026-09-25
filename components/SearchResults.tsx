"use client";

import { useEffect, useState } from "react";
import type { BookingRequest, Selection } from "@/lib/booking";
import type { FlightOffer } from "@/lib/providers/liteapi-flights";
import type { HotelOffer } from "@/lib/providers/liteapi-hotels";

export const SELECTION_KEY = "booking-selections";

const time = (iso: string) => iso.slice(11, 16);
const day = (iso: string) =>
  new Date(iso.slice(0, 10) + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" });

const money = (amount: number | string, currency: string) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(Number(amount));

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

function Status({ loading, error, empty, what }: { loading: boolean; error: string; empty: boolean; what: string }) {
  if (loading)
    return (
      <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" />
        <p className="mt-4 text-gray-600">Searching live {what}. This can take up to 30 seconds…</p>
      </div>
    );
  if (error) return <div className="rounded-2xl bg-red-50 p-6 text-red-700">{error}</div>;
  if (empty)
    return (
      <div className="rounded-2xl bg-white p-8 text-center text-gray-600 shadow-sm">
        No {what} found for this search. Try different dates or nearby airports/cities.
      </div>
    );
  return null;
}

function FlightResults({ booking, onSelect }: { booking: BookingRequest; onSelect: (s: Selection[]) => void }) {
  const { loading, error, offers } = useSearch<FlightOffer>("/api/flights", booking);
  const [open, setOpen] = useState<string | null>(null);
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
      <Status loading={loading} error={error} empty={offers.length === 0} what="flights" />
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
          <span className="ml-auto text-sm text-gray-500">Direct flights first, then by price</span>
        </div>
      )}
      {shown.map((o) => (
        <div key={o.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
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
                      <div className="text-lg font-bold">{time(first.departAt)}</div>
                      <div className="text-xs text-gray-500">
                        {s.from} · {day(first.departAt)}
                      </div>
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
                      <div className="text-lg font-bold">{time(last.arriveAt)}</div>
                      <div className="text-xs text-gray-500">
                        {s.to} · {day(last.arriveAt)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex flex-row items-center justify-between gap-3 md:w-44 md:flex-col md:items-end">
              <div className="text-right">
                <div className="text-xs text-gray-500">Airline fare (all travelers)</div>
                <div className="font-semibold">{money(o.price, o.currency)}</div>
              </div>
              <button
                className="btn-primary !px-5 !py-2 text-sm"
                onClick={() =>
                  onSelect([
                    {
                      ref: `LiteAPI flight offer ${o.id}`,
                      summary: [
                        `${o.airline}: ${o.slices.map((s) => s.segments.map((g) => g.flightNumber).join("+")).join(" / ")}`,
                        ...o.slices.map(
                          (s) =>
                            `${s.from} → ${s.to}  ${s.segments[0].departAt.replace("T", " ").slice(0, 16)}${
                              s.stops.length ? ` (via ${s.stops.join(", ")})` : ""
                            }`,
                        ),
                        `Airline fare: ${money(o.price, o.currency)}`,
                      ],
                    },
                  ])
                }
              >
                Select
              </button>
            </div>
          </div>
          <button
            className="mt-3 text-xs font-medium text-brand-600 hover:underline"
            onClick={() => setOpen(open === o.id ? null : o.id)}
          >
            {open === o.id ? "Hide details" : "Flight details"}
          </button>
          {open === o.id && (
            <div className="mt-3 space-y-2 border-t border-gray-100 pt-3 text-sm text-gray-700">
              {o.slices.flatMap((s) =>
                s.segments.map((g) => (
                  <div key={g.flightNumber + g.departAt} className="flex flex-wrap justify-between gap-2">
                    <span>
                      <strong>{g.flightNumber}</strong> {g.fromName} ({g.from}) → {g.toName} ({g.to})
                    </span>
                    <span className="text-gray-500">
                      {g.departAt.replace("T", " ").slice(0, 16)} → {g.arriveAt.replace("T", " ").slice(0, 16)}
                      {g.operatedBy !== g.carrier && ` · operated by ${g.operatedBy}`}
                    </span>
                  </div>
                )),
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function HotelCityResults({
  booking,
  index,
  selected,
  onSelect,
}: {
  booking: BookingRequest;
  index: number;
  selected: Selection | undefined;
  onSelect: (s: Selection) => void;
}) {
  const stay = booking.hotels![index];
  const { loading, error, offers } = useSearch<HotelOffer>("/api/hotels", { booking, index });

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold">
        Hotels in {stay.city} <span className="text-sm font-normal text-gray-500">({stay.checkIn} to {stay.checkOut})</span>
      </h2>
      <Status loading={loading} error={error} empty={offers.length === 0} what="hotels" />
      <div className="grid gap-4 md:grid-cols-2">
        {offers.map((h) => {
          const isSelected = selected?.ref === `LiteAPI hotel ${h.id}`;
          return (
            <div
              key={h.id}
              className={`flex gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ${isSelected ? "ring-2 ring-brand-600" : "ring-gray-100"}`}
            >
              {h.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={h.photo} alt="" className="h-28 w-28 shrink-0 rounded-lg object-cover" />
              ) : (
                <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-3xl">🏨</div>
              )}
              <div className="flex min-w-0 flex-1 flex-col">
                <h3 className="font-semibold">{h.name}</h3>
                {h.stars ? <div className="text-xs text-amber-500">{"★".repeat(Math.round(h.stars))}</div> : null}
                <p className="truncate text-xs text-gray-500">{h.address}</p>
                <p className="mt-1 text-xs text-gray-600">
                  {h.roomName}
                  {h.board && ` · ${h.board}`}
                </p>
                <div className="mt-auto flex items-end justify-between pt-2">
                  <div>
                    <div className="text-xs text-gray-500">Hotel rate (total)</div>
                    <div className="font-semibold">{money(h.price, h.currency)}</div>
                  </div>
                  <button
                    className={isSelected ? "btn-outline !px-4 !py-1.5 text-sm" : "btn-primary !px-4 !py-1.5 text-sm"}
                    onClick={() =>
                      onSelect({
                        ref: `LiteAPI hotel ${h.id}`,
                        summary: [
                          `${h.name}${h.stars ? ` (${h.stars}★)` : ""}`,
                          h.address,
                          `${stay.city}: ${stay.checkIn} to ${stay.checkOut}, ${h.roomName}`,
                          `Hotel rate: ${money(h.price, h.currency)}`,
                        ],
                      })
                    }
                  >
                    {isSelected ? "Selected ✓" : "Select"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function SearchResults({ booking, encoded }: { booking: BookingRequest; encoded: string }) {
  const [hotelPicks, setHotelPicks] = useState<(Selection | undefined)[]>([]);

  const proceed = (selections: Selection[]) => {
    try {
      sessionStorage.setItem(SELECTION_KEY, JSON.stringify({ booking: encoded, selections }));
    } catch {
      // Storage unavailable; the order page will ask the customer to search again.
    }
    window.location.assign(`/order?b=${encodeURIComponent(encoded)}`);
  };

  if (booking.service === "flight") return <FlightResults booking={booking} onSelect={proceed} />;

  const cities = booking.hotels!.length;
  const allPicked = Array.from({ length: cities }, (_, i) => hotelPicks[i]).every(Boolean);
  return (
    <div className="space-y-10 pb-24">
      {booking.hotels!.map((_, i) => (
        <HotelCityResults
          key={i}
          booking={booking}
          index={i}
          selected={hotelPicks[i]}
          onSelect={(s) => {
            const next = [...hotelPicks];
            next[i] = s;
            setHotelPicks(next);
            if (cities === 1) proceed([s]);
          }}
        />
      ))}
      {cities > 1 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white p-4">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 pr-16">
            <span className="text-sm text-gray-600">
              {hotelPicks.filter(Boolean).length} of {cities} hotels selected
            </span>
            <button
              className="btn-primary"
              disabled={!allPicked}
              onClick={() => proceed(hotelPicks as Selection[])}
            >
              Continue →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

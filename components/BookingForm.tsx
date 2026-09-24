"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import AirportInput from "./AirportInput";
import { countries, transitGroups } from "@/lib/countries";
import { encodeBooking, type BookingRequest, type FlightLeg, type HotelStay } from "@/lib/booking";
import type { TripType } from "@/lib/site";

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const today = () => new Date().toISOString().slice(0, 10);

const emptyLeg = (date: string, from = { label: "", code: "" }): FlightLeg => ({
  from: from.label,
  fromCode: from.code,
  to: "",
  toCode: "",
  date,
});

function TravelerSelect({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div>
      <label className="label">Travelers</label>
      <select className="input" value={value} onChange={(e) => onChange(Number(e.target.value))}>
        {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => (
          <option key={n} value={n}>
            {n} {n === 1 ? "Traveler" : "Travelers"}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function BookingForm() {
  const router = useRouter();
  const [tab, setTab] = useState<"flight" | "hotel">("flight");
  const [error, setError] = useState("");

  // Flight state
  const [tripType, setTripType] = useState<TripType>("roundtrip");
  const [legs, setLegs] = useState<FlightLeg[]>([emptyLeg(addDays(14))]);
  const [returnDate, setReturnDate] = useState(addDays(28));
  const [cabin, setCabin] = useState<"economy" | "business">("economy");
  const [flightTravelers, setFlightTravelers] = useState(1);
  const [excludeTransit, setExcludeTransit] = useState<string[]>([]);
  const [showTransit, setShowTransit] = useState(false);

  // Hotel state
  const [hotels, setHotels] = useState<HotelStay[]>([
    { city: "", countryCode: "", checkIn: addDays(14), checkOut: addDays(21) },
  ]);
  const [hotelTravelers, setHotelTravelers] = useState(1);

  const changeTripType = (t: TripType) => {
    setTripType(t);
    if (t === "multicity" && legs.length < 2) {
      setLegs([...legs, emptyLeg(addDays(21), { label: legs[0].to, code: legs[0].toCode })]);
    } else if (t !== "multicity") {
      setLegs([legs[0]]);
    }
  };

  const updateLeg = (i: number, patch: Partial<FlightLeg>) =>
    setLegs(legs.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  const updateHotel = (i: number, patch: Partial<HotelStay>) =>
    setHotels(hotels.map((h, idx) => (idx === i ? { ...h, ...patch } : h)));

  const swap = (i: number) =>
    updateLeg(i, { from: legs[i].to, fromCode: legs[i].toCode, to: legs[i].from, toCode: legs[i].fromCode });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    let booking: BookingRequest;
    if (tab === "flight") {
      if (legs.some((l) => !l.fromCode || !l.toCode)) {
        return setError("Please choose the origin and destination airports from the suggestions list.");
      }
      if (legs.some((l) => !l.date)) return setError("Please choose a departure date for every flight.");
      if (tripType === "roundtrip" && returnDate < legs[0].date) {
        return setError("Return date must be on or after the departure date.");
      }
      booking = {
        service: "flight",
        tripType,
        legs,
        returnDate: tripType === "roundtrip" ? returnDate : undefined,
        cabin,
        travelers: flightTravelers,
        excludeTransit,
      };
    } else {
      if (hotels.some((h) => !h.city.trim() || !h.countryCode || !h.checkIn || !h.checkOut)) {
        return setError("Please fill in the city, country and dates for every hotel.");
      }
      if (hotels.some((h) => h.checkOut <= h.checkIn)) {
        return setError("Check-out date must be after check-in date.");
      }
      booking = { service: "hotel", hotels, travelers: hotelTravelers };
    }
    router.push(`/search?b=${encodeBooking(booking)}`);
  };

  return (
    <form onSubmit={submit} className="rounded-2xl bg-white p-5 shadow-2xl shadow-navy-900/10 ring-1 ring-gray-100 md:p-7">
      <div className="mb-5 flex gap-2">
        {(["flight", "hotel"] as const).map((t) => (
          <button
            type="button"
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition ${
              tab === t ? "bg-brand-600 text-white" : "bg-brand-50 text-brand-600 hover:bg-brand-100"
            }`}
          >
            {t === "flight" ? "✈ Flight" : "🏨 Hotel"}
          </button>
        ))}
      </div>

      {tab === "flight" ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4 text-sm">
            {(
              [
                ["oneway", "One Way"],
                ["roundtrip", "Round Trip"],
                ["multicity", "Multi City"],
              ] as const
            ).map(([v, label]) => (
              <label key={v} className="flex cursor-pointer items-center gap-2 font-medium">
                <input
                  type="radio"
                  name="tripType"
                  className="accent-brand-600"
                  checked={tripType === v}
                  onChange={() => changeTripType(v)}
                />
                {label}
              </label>
            ))}
          </div>

          {legs.map((leg, i) => (
            <div key={i} className="grid gap-3 md:grid-cols-12 md:items-end">
              <div className="md:col-span-4">
                <AirportInput
                  label={legs.length > 1 ? `From (flight ${i + 1})` : "Origin"}
                  placeholder="Airport or code, e.g. Karachi, KHI"
                  value={{ label: leg.from, code: leg.fromCode }}
                  onChange={(v) => updateLeg(i, { from: v.label, fromCode: v.code })}
                />
              </div>
              <div className="hidden justify-center md:col-span-1 md:flex">
                <button
                  type="button"
                  onClick={() => swap(i)}
                  className="mb-1 rounded-full p-2 text-brand-600 hover:bg-brand-50"
                  aria-label="Swap origin and destination"
                >
                  ⇄
                </button>
              </div>
              <div className="md:col-span-4">
                <AirportInput
                  label="Destination"
                  placeholder="Airport or code, e.g. Paris, CDG"
                  value={{ label: leg.to, code: leg.toCode }}
                  onChange={(v) => updateLeg(i, { to: v.label, toCode: v.code })}
                />
              </div>
              <div className="md:col-span-3">
                <label className="label">Depart Date</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    className="input"
                    min={today()}
                    value={leg.date}
                    onChange={(e) => updateLeg(i, { date: e.target.value })}
                  />
                  {tripType === "multicity" && legs.length > 2 && (
                    <button
                      type="button"
                      className="px-2 text-gray-400 hover:text-red-500"
                      aria-label="Remove flight"
                      onClick={() => setLegs(legs.filter((_, idx) => idx !== i))}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {tripType === "multicity" && legs.length < 6 && (
            <button
              type="button"
              className="text-sm font-semibold text-brand-600 hover:underline"
              onClick={() => {
                const last = legs[legs.length - 1];
                setLegs([...legs, emptyLeg(last.date, { label: last.to, code: last.toCode })]);
              }}
            >
              + Add More Cities
            </button>
          )}

          <div className="grid gap-3 md:grid-cols-3">
            {tripType === "roundtrip" && (
              <div>
                <label className="label">Return Date</label>
                <input
                  type="date"
                  className="input"
                  min={legs[0].date || today()}
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                />
              </div>
            )}
            <div>
              <label className="label">Class</label>
              <select className="input" value={cabin} onChange={(e) => setCabin(e.target.value as "economy" | "business")}>
                <option value="economy">Economy Class</option>
                <option value="business">Business Class</option>
              </select>
            </div>
            <TravelerSelect value={flightTravelers} onChange={setFlightTravelers} />
          </div>

          <div>
            <button
              type="button"
              className="text-sm font-medium text-gray-600 hover:text-brand-600"
              onClick={() => setShowTransit((s) => !s)}
            >
              {showTransit ? "▾" : "▸"} Exclude transit countries{" "}
              {excludeTransit.length > 0 && `(${excludeTransit.length})`}
            </button>
            {showTransit && (
              <div className="mt-2 flex flex-wrap gap-2">
                {transitGroups.map(({ label: c }) => {
                  const on = excludeTransit.includes(c);
                  return (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setExcludeTransit(on ? excludeTransit.filter((x) => x !== c) : [...excludeTransit, c])}
                      className={`rounded-full border px-3 py-1 text-xs font-medium ${
                        on ? "border-brand-600 bg-brand-600 text-white" : "border-gray-300 text-gray-600"
                      }`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Add one hotel for each city you&apos;ll stay in.</p>
          {hotels.map((h, i) => (
            <div key={i} className="grid gap-3 md:grid-cols-12 md:items-end">
              <div className="md:col-span-3">
                <label className="label">City Name</label>
                <input
                  className="input"
                  placeholder="e.g. Rome"
                  value={h.city}
                  onChange={(e) => updateHotel(i, { city: e.target.value })}
                />
              </div>
              <div className="md:col-span-3">
                <label className="label">Country</label>
                <select
                  className="input"
                  value={h.countryCode}
                  onChange={(e) => updateHotel(i, { countryCode: e.target.value })}
                >
                  <option value="">Select country</option>
                  {countries.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-3">
                <label className="label">Check-in Date</label>
                <input
                  type="date"
                  className="input"
                  min={today()}
                  value={h.checkIn}
                  onChange={(e) => updateHotel(i, { checkIn: e.target.value })}
                />
              </div>
              <div className="md:col-span-3">
                <label className="label">Check-out Date</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    className="input"
                    min={h.checkIn || today()}
                    value={h.checkOut}
                    onChange={(e) => updateHotel(i, { checkOut: e.target.value })}
                  />
                  {hotels.length > 1 && (
                    <button
                      type="button"
                      className="px-2 text-gray-400 hover:text-red-500"
                      aria-label="Remove hotel"
                      onClick={() => setHotels(hotels.filter((_, idx) => idx !== i))}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {hotels.length < 10 && (
            <button
              type="button"
              className="text-sm font-semibold text-brand-600 hover:underline"
              onClick={() => {
                const last = hotels[hotels.length - 1];
                setHotels([
                  ...hotels,
                  { city: "", countryCode: last.countryCode, checkIn: last.checkOut, checkOut: last.checkOut },
                ]);
              }}
            >
              + Add another city
            </button>
          )}
          <div className="grid gap-3 md:grid-cols-3">
            <TravelerSelect value={hotelTravelers} onChange={setHotelTravelers} />
          </div>
        </div>
      )}

      {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <button type="submit" className="btn-primary mt-6 w-full md:w-auto md:px-10">
        {tab === "flight" ? "Search Flights" : "Search Hotels"} →
      </button>
    </form>
  );
}

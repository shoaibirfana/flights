"use client";

import { useEffect, useRef, useState } from "react";

type Place = { code: string; label: string };

// Airport autocomplete backed by the live airport list from /api/places.
export default function AirportInput({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: { label: string; code: string };
  onChange: (v: { label: string; code: string }) => void;
}) {
  const [text, setText] = useState(value.label);
  const [places, setPlaces] = useState<Place[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);

  // Sync when the value changes from outside (e.g. the swap button).
  useEffect(() => setText(value.label), [value.label]);

  useEffect(() => {
    if (!open || text.trim().length < 2 || value.code) return;
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/places?q=${encodeURIComponent(text.trim())}`, { signal: ctrl.signal });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setPlaces(data.places);
      } catch (e) {
        if (!ctrl.signal.aborted) setError(e instanceof Error && e.message ? e.message : "Search failed");
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [text, open, value.code]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div className="relative" ref={boxRef}>
      <label className="label">{label}</label>
      <input
        className="input"
        placeholder={placeholder}
        value={text}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setText(e.target.value);
          setOpen(true);
          onChange({ label: e.target.value, code: "" });
        }}
      />
      {open && text.trim().length >= 2 && !value.code && (
        <ul className="absolute z-30 mt-1 max-h-72 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          {loading && <li className="px-3 py-2 text-sm text-gray-500">Searching…</li>}
          {!loading && error && <li className="px-3 py-2 text-sm text-red-600">{error}</li>}
          {!loading && !error && places.length === 0 && (
            <li className="px-3 py-2 text-sm text-gray-500">No airports found</li>
          )}
          {!loading &&
            places.map((p) => (
              <li key={p.code}>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-brand-50"
                  onClick={() => {
                    onChange({ label: p.label, code: p.code });
                    setText(p.label);
                    setOpen(false);
                  }}
                >
                  <span>✈</span>
                  <span>{p.label}</span>
                </button>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}

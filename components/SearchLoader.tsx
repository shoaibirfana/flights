"use client";

import { useEffect, useState } from "react";

const steps: Record<"flights" | "hotels", string[]> = {
  flights: [
    "Connecting to airlines",
    "Checking live schedules",
    "Comparing routes",
    "Finding direct flights",
    "Organizing your options",
    "Almost ready",
  ],
  hotels: [
    "Connecting to hotels",
    "Checking availability",
    "Comparing rooms",
    "Organizing your options",
    "Almost ready",
  ],
};

// Calm, setup-style loading: one short message at a time and a thin progress line that eases toward
// the end without claiming to finish (the real finish is the results appearing).
export default function SearchLoader({ what }: { what: "flights" | "hotels" }) {
  const messages = steps[what];
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(4);

  useEffect(() => {
    const started = Date.now();
    const timer = setInterval(() => {
      const t = (Date.now() - started) / 1000;
      setStep(Math.min(messages.length - 1, Math.floor(t / 3.5)));
      setProgress(4 + 88 * (1 - Math.exp(-t / 9)));
    }, 200);
    return () => clearInterval(timer);
  }, [messages.length]);

  return (
    <div className="flex flex-col items-center rounded-2xl bg-white px-6 py-16 text-center shadow-sm" role="status" aria-live="polite">
      <div className="loader-orb mb-8" aria-hidden />
      <p key={step} className="loader-message text-lg font-medium text-navy-900">
        {messages[step]}
      </p>
      <div className="mt-6 h-1 w-56 overflow-hidden rounded-full bg-gray-100">
        <div className="h-full rounded-full bg-brand-600 transition-[width] duration-500 ease-out" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

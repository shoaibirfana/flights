import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import { faqs } from "@/lib/faqs";

export const metadata: Metadata = {
  title: "FAQ: Flight Reservation for Visa",
  description: "Answers about flight and hotel reservations for visa applications: PNR, validity, date changes and more.",
};

export default function FaqPage() {
  return (
    <>
      <PageHeader title="Frequently Asked Questions" subtitle="Everything you need to know about visa reservations." />
      <div className="mx-auto max-w-3xl space-y-3 px-4 py-16">
        {faqs.map((f) => (
          <details key={f.q} className="group rounded-xl border border-gray-200 bg-white p-5 open:shadow-sm">
            <summary className="flex cursor-pointer list-none items-center justify-between font-semibold">
              {f.q}
              <span className="ml-4 text-brand-600 transition group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 leading-relaxed text-gray-700">{f.a}</p>
          </details>
        ))}
      </div>
    </>
  );
}

import Link from "next/link";
import BookingForm from "@/components/BookingForm";
import { faqs } from "@/lib/faqs";
import { formatPrice, pricing, site } from "@/lib/site";

const steps = [
  {
    title: "Search Flight or Hotel",
    text: "Enter your route and dates. We show live flights and hotels with real schedules and availability.",
    icon: "🔎",
  },
  {
    title: "Select Your Option",
    text: "Compare the results and pick the flight or hotel that matches your travel plan.",
    icon: "✅",
  },
  {
    title: "Submit Traveler Details",
    text: "Enter each traveler's name exactly as it appears on the passport, plus your contact details.",
    icon: "🧾",
  },
  {
    title: "Receive Your PDF",
    text: "We email your reservation PDF, ready to print and submit with your visa application.",
    icon: "📩",
  },
];

const reasons = [
  "Fast delivery of your reservation PDF by email",
  "Verifiable reservation with airline booking reference (PNR)",
  "Avoid transit in countries that require a transit visa",
  "Free date changes if your appointment or travel plan changes",
  "No need to buy an expensive non-refundable ticket before your visa is approved",
  "Support by email and WhatsApp",
];

function HeroArt() {
  return (
    <svg viewBox="0 0 1440 220" className="pointer-events-none absolute inset-x-0 bottom-0 w-full" preserveAspectRatio="none" aria-hidden>
      <path fill="#ffffff" fillOpacity="0.08" d="M0 120c240-60 480-60 720 0s480 60 720 0v100H0z" />
      <path fill="#ffffff" fillOpacity="0.12" d="M0 160c200-40 440-40 720 10s520 40 720-10v60H0z" />
      <path fill="#ffffff" d="M0 190c260-30 520-30 720 0s460 30 720 0v30H0z" />
    </svg>
  );
}

export default function Home() {
  return (
    <>
      {/* Hero + booking form */}
      <section id="book" className="relative overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 pb-40">
        <div className="pointer-events-none absolute top-16 right-10 hidden text-8xl opacity-20 lg:block">✈</div>
        <div className="relative z-10 mx-auto max-w-7xl px-4 pt-14 md:pt-20">
          <div className="mx-auto max-w-3xl text-center text-white">
            <span className="inline-block rounded-full bg-white/15 px-4 py-1 text-xs font-medium tracking-wide uppercase">
              From {formatPrice(pricing.flight)} per traveler
            </span>
            <h1 className="mt-4 text-3xl leading-tight font-bold md:text-5xl">
              Flight Reservation for Visa: Get Your Itinerary PDF Fast
            </h1>
            <p className="mt-4 text-base text-white/85 md:text-lg">
              Verifiable flight reservations and hotel bookings for Schengen, UK, USA, Canada and other visa
              applications, without buying a full ticket.
            </p>
          </div>
          <div className="mx-auto mt-10 max-w-5xl">
            <BookingForm />
          </div>
        </div>
        <HeroArt />
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 py-20">
        <h2 className="text-center text-2xl font-bold md:text-4xl">How To Book a Flight or Hotel for Your Visa</h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <div key={s.title} className="relative rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 font-bold text-white">
                  {i + 1}
                </span>
                <span className="text-3xl">{s.icon}</span>
              </div>
              <h3 className="text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* What is */}
      <section className="bg-brand-50">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold md:text-3xl">What Is a Flight Reservation for Visa?</h2>
            <p className="mt-4 leading-relaxed text-gray-700">
              A flight reservation for a visa is a temporary airline booking that shows your planned travel. Embassies
              and consulates ask for it to check your travel plans before they issue a visa. It includes your name,
              flight numbers, dates and a booking reference (PNR). You don&apos;t have to pay for a full,
              non-refundable ticket.
            </p>
            <p className="mt-4 leading-relaxed text-gray-700">
              Many embassies recommend <strong>not</strong> buying a ticket until your visa is approved. That
              includes the Schengen countries, the UK, Canada and Australia. A reservation meets the requirement at a
              small fraction of the cost.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-bold md:text-3xl">What Is a Hotel Reservation for Visa?</h2>
            <p className="mt-4 leading-relaxed text-gray-700">
              A hotel reservation shows where you will stay during your trip, with the hotel&apos;s name, address and
              your check-in and check-out dates. Most tourist and visit visa applications ask for proof of
              accommodation for every night of the stay.
            </p>
            <p className="mt-4 leading-relaxed text-gray-700">
              We can book hotels in several cities, so your accommodation matches your itinerary exactly.
            </p>
          </div>
        </div>
      </section>

      {/* Why us */}
      <section className="mx-auto max-w-7xl px-4 py-20">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold md:text-4xl">
              Why Do I Need a Flight &amp; Hotel Reservation for My Visa Application?
            </h2>
            <p className="mt-5 leading-relaxed text-gray-700">
              If you plan to travel abroad, you may need a visa from the embassy of the country you&apos;re visiting.
              Most visa applications ask for proof of your travel plans: a flight itinerary and an accommodation
              booking. With {site.name}, you can get both quickly for any destination.
            </p>
          </div>
          <ul className="space-y-4">
            {reasons.map((r) => (
              <li key={r} className="flex items-start gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs text-white">
                  ✓
                </span>
                <span className="text-gray-800">{r}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="scroll-mt-20 bg-navy-900 py-20 text-white">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-center text-2xl font-bold md:text-4xl">Pricing &amp; Plans</h2>
          <p className="mt-3 text-center text-gray-300">Simple, transparent pricing with no hidden fees.</p>
          <div className="mt-12 grid gap-8 md:grid-cols-2">
            {[
              {
                name: "Flight Reservation",
                price: pricing.flight,
                features: [
                  "One-way or round-trip",
                  "Verifiable airline PNR",
                  "No fee to change date",
                  `Multi-city: +${formatPrice(pricing.extraFlightLeg)} per extra flight`,
                ],
                href: "/#book",
              },
              {
                name: "Hotel Reservation",
                price: pricing.hotel,
                features: ["Any length of stay", "Any city worldwide", "No fee to change date", "Price is per city"],
                href: "/#book",
              },
            ].map((p) => (
              <div key={p.name} className="rounded-2xl bg-white p-8 text-navy-900 shadow-xl">
                <h3 className="text-xl font-semibold">{p.name}</h3>
                <div className="mt-4 flex items-end gap-1">
                  <span className="text-5xl font-bold text-brand-600">{formatPrice(p.price)}</span>
                  <span className="mb-1 text-sm text-gray-500">/ per person or child</span>
                </div>
                <ul className="mt-6 space-y-3 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <span className="text-brand-600">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link href={p.href} className="btn-primary mt-8 w-full">
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ preview */}
      <section className="mx-auto max-w-4xl px-4 py-20">
        <h2 className="text-center text-2xl font-bold md:text-4xl">Frequently Asked Questions</h2>
        <div className="mt-10 space-y-3">
          {faqs.slice(0, 5).map((f) => (
            <details key={f.q} className="group rounded-xl border border-gray-200 bg-white p-5 open:shadow-sm">
              <summary className="flex cursor-pointer list-none items-center justify-between font-semibold">
                {f.q}
                <span className="ml-4 text-brand-600 transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 leading-relaxed text-gray-700">{f.a}</p>
            </details>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link href="/faq" className="btn-outline">
            Read the full FAQ
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-20">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 rounded-3xl bg-gradient-to-r from-brand-700 to-brand-500 p-10 text-white md:flex-row">
          <div>
            <h2 className="text-2xl font-bold md:text-3xl">Ready to apply for your visa?</h2>
            <p className="mt-2 text-white/85">Get your flight and hotel reservation today.</p>
          </div>
          <Link href="/#book" className="rounded-lg bg-white px-8 py-3 font-semibold text-brand-700 hover:bg-brand-50">
            Book Now
          </Link>
        </div>
      </section>
    </>
  );
}

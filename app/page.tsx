import Link from "next/link";
import BookingForm from "@/components/BookingForm";
import Icon, { type IconName } from "@/components/Icon";
import { LogoMark } from "@/components/Logo";
import Reveal from "@/components/Reveal";
import SectionHeading from "@/components/SectionHeading";
import { faqs } from "@/lib/faqs";
import { formatPrice, pricing, site } from "@/lib/site";

const steps: { title: string; text: string; icon: IconName }[] = [
  {
    title: "Search your flight",
    text: "Enter your route and dates. We show live flights from real airlines.",
    icon: "search",
  },
  {
    title: "Choose an option",
    text: "Pick the airline and route that match your travel plan and visa appointment.",
    icon: "route",
  },
  {
    title: "Add traveler names",
    text: "Enter each name exactly as it appears on the passport, plus your email.",
    icon: "user",
  },
  {
    title: "Download instantly",
    text: "Download your trip summary (PDF) right away on the website. A copy is also emailed to you.",
    icon: "mail",
  },
];

const features: { title: string; text: string; icon: IconName }[] = [
  {
    title: "Clear flight itinerary",
    text: "Your trip summary shows the airline, flight numbers, times and traveler names in one clean PDF.",
    icon: "shield",
  },
  {
    title: "Instant download",
    text: "Your trip summary PDF is ready to download as soon as you place your order, with a copy sent to your email.",
    icon: "clock",
  },
  {
    title: "No expensive ticket",
    text: "Don't buy a non-refundable ticket before your visa is approved. A reservation costs a fraction of it.",
    icon: "wallet",
  },
  {
    title: "Avoid transit visas",
    text: "Exclude countries like the USA, UK or Schengen area so your route needs no transit visa.",
    icon: "globe",
  },
  {
    title: "Free date changes",
    text: "Appointment moved? Send us your order ID and new dates and we update the reservation.",
    icon: "refresh",
  },
  {
    title: "Real people, quick help",
    text: "Questions about your reservation? Email us at support@vizabunny.com and we'll help.",
    icon: "chat",
  },
];

const trust = ["Live airline data", "Any destination", "Instant PDF download", `From ${formatPrice(pricing.flight)}`];

function HeroBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="float-slow absolute -top-24 -left-24 h-96 w-96 rounded-full bg-white/5 blur-2xl" />
      <div className="float-slow absolute top-40 -right-32 h-[28rem] w-[28rem] rounded-full bg-cream/10 blur-3xl" style={{ animationDelay: "-4s" }} />
      <svg viewBox="0 0 1440 320" className="absolute inset-x-0 top-24 w-full opacity-40" preserveAspectRatio="none">
        <path
          className="flight-path"
          d="M -40 210 C 260 40, 620 40, 1000 150 S 1400 120, 1500 60"
          fill="none"
          stroke="#f3e2d4"
          strokeWidth="2"
        />
      </svg>
      <div className="absolute inset-x-0 top-24 h-[320px] w-full">
        <div className="flight-plane absolute top-0 left-0 text-cream">
          <Icon name="plane" className="h-7 w-7 rotate-45" />
        </div>
      </div>
      <svg viewBox="0 0 1440 120" className="absolute inset-x-0 bottom-0 w-full" preserveAspectRatio="none">
        <path fill="#ffffff" d="M0 80c240-40 480-40 720 0s480 40 720 0v40H0z" />
      </svg>
    </div>
  );
}

export default function Home() {
  return (
    <>
      {/* Hero + search */}
      <section id="book" className="relative scroll-mt-16 bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 pb-32">
        <HeroBackdrop />
        <LogoMark
          className="pointer-events-none absolute top-16 right-10 hidden h-44 w-auto opacity-[0.07] lg:block"
          color="#f3e2d4"
          accent="#17313e"
        />
        <div className="relative z-10 mx-auto max-w-7xl px-4 pt-14 md:pt-20">
          <div className="hero-in mx-auto max-w-3xl text-center text-white">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-medium tracking-wide text-cream ring-1 ring-white/15 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Flight reservations for visa applications
            </span>
            <h1 className="mt-6 text-4xl leading-[1.1] font-bold tracking-tight md:text-6xl">
              Your visa flight reservation, <span className="text-cream">without buying a ticket</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base text-white/80 md:text-lg">
              Search live flights, choose your route and download your flight itinerary for Schengen, UK, USA,
              Canada and other visa applications.
            </p>
            <ul className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-white/80">
              {trust.map((t) => (
                <li key={t} className="flex items-center gap-1.5">
                  <Icon name="check" className="h-4 w-4 text-emerald-300" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="hero-in hero-late mx-auto mt-10 max-w-5xl">
            <div>
              <BookingForm />
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 py-24">
        <SectionHeading
          eyebrow="How it works"
          title="Four steps to your reservation"
          intro="No account, no ticket purchase. Just your route, the traveler names and an email address."
        />
        <ol className="relative mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <Reveal as="li" key={s.title} delay={i * 100}>
              <div className="card-lift h-full rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-cream">
                    <Icon name={s.icon} className="h-6 w-6" />
                  </span>
                  <span className="text-4xl font-bold text-brand-100">0{i + 1}</span>
                </div>
                <h3 className="mt-5 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{s.text}</p>
              </div>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* Features */}
      <section className="bg-brand-50">
        <div className="mx-auto max-w-7xl px-4 py-24">
          <SectionHeading
            eyebrow={`Why ${site.name}`}
            title="Everything your visa application needs"
            intro="Embassies ask for proof of your travel plans. We make that part quick and affordable."
          />
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <Reveal key={f.title} delay={(i % 3) * 100}>
                <div className="card-lift h-full rounded-2xl bg-white p-7 ring-1 ring-brand-100">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 text-brand-600 ring-1 ring-brand-100">
                    <Icon name={f.icon} />
                  </span>
                  <h3 className="mt-5 font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">{f.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Explainer */}
      <section className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-24 md:grid-cols-2">
        <Reveal>
          <p className="text-xs font-semibold tracking-[0.2em] text-brand-500 uppercase">Good to know</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">What is a flight reservation for a visa?</h2>
          <p className="mt-5 leading-relaxed text-gray-700">
            It&apos;s a flight itinerary that shows your planned travel: your name, flights and dates. Embassies and
            consulates ask for your travel plans before issuing a visa, and you don&apos;t have to pay for a full
            ticket.
          </p>
          <p className="mt-4 leading-relaxed text-gray-700">
            Many embassies, including the Schengen countries, the UK, Canada and Australia, advise{" "}
            <strong>not</strong> buying a ticket until your visa is approved.
          </p>
        </Reveal>
        <Reveal delay={150}>
          <div className="relative overflow-hidden rounded-3xl bg-navy-900 p-8 text-white shadow-xl">
            <LogoMark className="absolute -right-6 -bottom-6 h-40 w-auto opacity-10" color="#f3e2d4" accent="#17313e" />
            <div className="grid grid-cols-3 gap-3 text-xs tracking-wide text-white/50 uppercase">
              <span />
              <span>Reservation</span>
              <span>Ticket</span>
            </div>
            <ul className="mt-5 space-y-4 text-sm">
              {[
                ["Price", `From ${formatPrice(pricing.flight)}`, "Full fare, often non-refundable"],
                ["If the visa is refused", "Nothing more to pay", "Money may be lost"],
                ["Ready", "Instantly, as a PDF", "After purchase"],
                ["Can be used to fly", "No", "Yes"],
              ].map(([label, ours, ticket]) => (
                <li key={label} className="grid grid-cols-3 gap-3 border-t border-white/10 pt-4">
                  <span className="text-white/60">{label}</span>
                  <span className="font-semibold text-cream">{ours}</span>
                  <span className="text-white/70">{ticket}</span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative scroll-mt-20 overflow-hidden bg-navy-900 py-24 text-white">
        <div className="float-slow pointer-events-none absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-brand-500/40 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4">
          <SectionHeading eyebrow="Pricing" title="One simple price" intro="No hidden fees. Pay per traveler." light />
          <Reveal className="mx-auto mt-12 max-w-md">
            <div className="rounded-3xl bg-white p-8 text-navy-900 shadow-2xl ring-1 ring-white/10">
              <h3 className="text-lg font-semibold">Flight reservation</h3>
              <div className="mt-4 flex items-end gap-2">
                <span className="text-6xl font-bold tracking-tight text-brand-600">{formatPrice(pricing.flight)}</span>
                <span className="mb-2 text-sm text-gray-500">per traveler</span>
              </div>
              <ul className="mt-8 space-y-3 text-sm">
                {[
                  "One-way, round-trip or multi-city",
                  "Instant PDF trip summary",
                  "Free date changes",
                  pricing.extraFlightLeg > 0
                    ? `Multi-city: +${formatPrice(pricing.extraFlightLeg)} per extra flight`
                    : "Multi-city at no extra cost",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-3">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                      <Icon name="check" className="h-3.5 w-3.5" />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/#book" className="btn-primary group mt-8 w-full">
                Get started
                <Icon name="arrow" className="h-4 w-4 transition group-hover:translate-x-1" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FAQ preview */}
      <section className="mx-auto max-w-3xl px-4 py-24">
        <SectionHeading eyebrow="FAQ" title="Questions, answered" />
        <div className="mt-12 space-y-3">
          {faqs.slice(0, 5).map((f, i) => (
            <Reveal key={f.q} delay={i * 60}>
              <details className="faq group rounded-2xl border border-gray-200 bg-white p-5 transition open:border-brand-200 open:shadow-sm">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                  {f.q}
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600 transition group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 leading-relaxed text-gray-700">{f.a}</p>
              </details>
            </Reveal>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link href="/faq" className="btn-outline">
            Read the full FAQ
          </Link>
        </div>
      </section>

      {/* Call to action */}
      <section className="px-4 pb-24">
        <Reveal className="mx-auto max-w-6xl">
          <div className="relative flex flex-col items-center justify-between gap-6 overflow-hidden rounded-3xl bg-gradient-to-r from-brand-700 to-brand-500 p-10 text-white md:flex-row md:p-14">
            <LogoMark className="absolute -top-8 right-40 h-48 w-auto opacity-10" color="#f3e2d4" accent="#17313e" />
            <div className="relative">
              <h2 className="text-2xl font-bold md:text-3xl">Ready for your visa application?</h2>
              <p className="mt-2 text-white/80">Search your flight and get your reservation today.</p>
            </div>
            <Link
              href="/#book"
              className="group relative inline-flex items-center gap-2 rounded-xl bg-cream px-8 py-3.5 font-semibold text-navy-900 transition hover:bg-white"
            >
              Search flights
              <Icon name="arrow" className="h-4 w-4 transition group-hover:translate-x-1" />
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}

import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Terms & Conditions" };

export default function TermsPage() {
  return (
    <>
      <PageHeader title="Terms & Conditions" />
      <div className="prose-page mx-auto max-w-3xl px-4 py-16">
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          Draft template: have these terms reviewed by a legal professional before launch.
        </p>
        <h2>1. Service</h2>
        <p>
          {site.name} provides flight itineraries (trip summaries) for use as supporting documents in visa
          applications. An itinerary is not a paid ticket and can&apos;t be used to board a flight. To travel, buy a
          ticket from the airline or a travel agent.
        </p>
        <h2>2. Customer responsibilities</h2>
        <p>
          You must provide accurate traveler names as shown on the passport. You are responsible for checking the
          requirements of the embassy or consulate you apply to.
        </p>
        <h2>3. Validity</h2>
        <p>
          Your itinerary shows the flights available when you ordered. Airline schedules can change, and we
          don&apos;t guarantee that a flight stays available for any particular length of time.
        </p>
        <h2>4. Visa decisions</h2>
        <p>
          Visa decisions are made only by the relevant authorities. {site.name} doesn&apos;t guarantee visa approval
          and isn&apos;t liable for refusals.
        </p>
        <h2>5. Prices and third-party data</h2>
        <p>
          Flight schedules, and fares shown in search results come from third-party providers and may
          change until the reservation is made.
        </p>
        <h2>6. Contact</h2>
        <p>Questions about these terms: {site.email}</p>
      </div>
    </>
  );
}

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
          {site.name} provides flight and hotel reservations for use as supporting documents in visa applications. A
          reservation is not a paid ticket or a paid hotel stay and can&apos;t be used to board a flight or check in
          to a hotel.
        </p>
        <h2>2. Customer responsibilities</h2>
        <p>
          You must provide accurate traveler names as shown on the passport. You are responsible for checking the
          requirements of the embassy or consulate you apply to.
        </p>
        <h2>3. Validity</h2>
        <p>
          Airlines and hotels may cancel unpaid reservations after a period they set. We don&apos;t guarantee that a
          reservation stays active for any particular length of time.
        </p>
        <h2>4. Visa decisions</h2>
        <p>
          Visa decisions are made only by the relevant authorities. {site.name} doesn&apos;t guarantee visa approval
          and isn&apos;t liable for refusals.
        </p>
        <h2>5. Prices and third-party data</h2>
        <p>
          Flight schedules, fares and hotel rates shown in search results come from third-party providers and may
          change until the reservation is made.
        </p>
        <h2>6. Contact</h2>
        <p>Questions about these terms: {site.email}</p>
      </div>
    </>
  );
}

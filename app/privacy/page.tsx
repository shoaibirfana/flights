import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <>
      <PageHeader title="Privacy Policy" />
      <div className="prose-page mx-auto max-w-3xl px-4 py-16">
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          Draft template: have this policy reviewed by a legal professional before launch.
        </p>
        <h2>Information we collect</h2>
        <p>
          We collect the traveler names, nationality, email address, phone number and trip details you give us when
          you place an order.
        </p>
        <h2>How we use it</h2>
        <ul>
          <li>To search flights and hotels and to make your reservation</li>
          <li>To contact you about your order</li>
          <li>To meet legal and accounting requirements</li>
        </ul>
        <h2>Sharing</h2>
        <p>
          We share your details only with the airlines, hotels and booking providers needed to make your
          reservation. We don&apos;t sell your personal data.
        </p>
        <h2>Contact</h2>
        <p>For privacy requests, email {site.email}.</p>
      </div>
    </>
  );
}

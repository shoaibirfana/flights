import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Refund Policy" };

export default function RefundPage() {
  return (
    <>
      <PageHeader title="Refund Policy" />
      <div className="prose-page mx-auto max-w-3xl px-4 py-16">
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          Draft template: adjust to your business rules before launch.
        </p>
        <h2>Before your reservation is issued</h2>
        <p>If you cancel before we send your reservation, you&apos;ll get a full refund.</p>
        <h2>After your reservation is issued</h2>
        <p>
          Once we&apos;ve sent your reservation, the service is complete and the fee is non-refundable. Date changes
          are free: contact us with your order ID.
        </p>
        <h2>Our errors</h2>
        <p>If we make a mistake on your reservation, we&apos;ll correct it for free or refund you in full.</p>
        <h2>Contact</h2>
        <p>Refund requests: {site.email}</p>
      </div>
    </>
  );
}

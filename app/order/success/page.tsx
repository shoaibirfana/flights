import Link from "next/link";
import type { Metadata } from "next";
import { site, whatsappLink } from "@/lib/site";

export const metadata: Metadata = { title: "Order Received" };

export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  const orderId = (id ?? "").replace(/[^A-Z0-9-]/gi, "").slice(0, 30);

  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl text-green-600">✓</div>
      <h1 className="mt-6 text-3xl font-bold">Order Received!</h1>
      {orderId && (
        <p className="mt-3 text-gray-700">
          Your order ID is <strong className="text-brand-600">{orderId}</strong>
        </p>
      )}
      <p className="mt-4 leading-relaxed text-gray-600">
        We&apos;ve emailed you a confirmation. Our team will contact you shortly by email or WhatsApp to confirm your
        reservation and send your PDF.
      </p>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <a
          href={whatsappLink(`Hi, I just placed order ${orderId} on ${site.name}.`)}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary"
        >
          Message us on WhatsApp
        </a>
        <Link href="/" className="btn-outline">
          Back to Home
        </Link>
      </div>
    </div>
  );
}

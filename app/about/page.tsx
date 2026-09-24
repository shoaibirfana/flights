import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "About Us" };

export default function AboutPage() {
  return (
    <>
      <PageHeader title={`About ${site.name}`} subtitle={site.tagline} />
      <div className="prose-page mx-auto max-w-3xl px-4 py-16">
        <p>
          {site.name} helps travelers get the flight and hotel reservations they need for visa applications quickly
          and at a low cost, without buying expensive tickets before their visa is approved.
        </p>
        <h2>What we do</h2>
        <p>
          You search live flights and hotels, choose the option that fits your plans, and we arrange the reservation
          and email you a PDF to submit with your visa application.
        </p>
        <h2>Why travelers choose us</h2>
        <ul>
          <li>Live flight schedules and hotel availability</li>
          <li>Verifiable airline booking references (PNR)</li>
          <li>Free date changes</li>
          <li>Support by email and WhatsApp</li>
        </ul>
        <p>
          <Link href="/#book" className="text-brand-600 underline">
            Start your booking →
          </Link>
        </p>
      </div>
    </>
  );
}

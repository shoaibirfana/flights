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
          {site.name} helps travelers get the flight reservations they need for visa applications quickly
          and at a low cost, without buying expensive tickets before their visa is approved.
        </p>
        <h2>What we do</h2>
        <p>
          You search live flights, choose the option that fits your plans, and download your trip summary
          (PDF) instantly on the website. A copy is also emailed to you.
        </p>
        <h2>Why travelers choose us</h2>
        <ul>
          <li>Live flight schedules from real airlines</li>
          <li>Instant PDF trip summary</li>
          <li>Free date changes</li>
          <li>Support by email</li>
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

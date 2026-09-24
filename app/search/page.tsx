import Link from "next/link";
import type { Metadata } from "next";
import SearchResults from "@/components/SearchResults";
import { decodeBooking, describeBooking } from "@/lib/booking";

export const metadata: Metadata = { title: "Search Results" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ b?: string }> }) {
  const { b } = await searchParams;
  const booking = decodeBooking(b);

  if (!booking) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Search details missing</h1>
        <p className="mt-3 text-gray-600">Please enter your flight or hotel details to search.</p>
        <Link href="/#book" className="btn-primary mt-6">
          Start Search
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] bg-gray-50">
      <div className="bg-brand-600 text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-5">
          <div className="text-sm">
            {describeBooking(booking).map((l) => (
              <div key={l}>{l}</div>
            ))}
          </div>
          <Link href="/#book" className="rounded-lg bg-white/15 px-4 py-2 text-sm font-semibold hover:bg-white/25">
            Modify Search
          </Link>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <SearchResults booking={booking} encoded={b!} />
      </div>
    </div>
  );
}

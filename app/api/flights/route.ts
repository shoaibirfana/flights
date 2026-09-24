import { NextResponse } from "next/server";
import { validateBooking } from "@/lib/booking";
import { ProviderError } from "@/lib/providers/liteapi";
import { searchFlights } from "@/lib/providers/liteapi-flights";

export const maxDuration = 60;

export async function POST(req: Request) {
  const booking = validateBooking(await req.json().catch(() => null));
  if (!booking || booking.service !== "flight") {
    return NextResponse.json({ error: "Invalid flight search." }, { status: 400 });
  }
  try {
    return NextResponse.json({ offers: await searchFlights(booking) });
  } catch (e) {
    const status = e instanceof ProviderError ? e.status : 500;
    console.error(e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Flight search failed" }, { status });
  }
}

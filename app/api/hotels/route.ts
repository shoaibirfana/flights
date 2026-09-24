import { NextResponse } from "next/server";
import { validateBooking } from "@/lib/booking";
import { ProviderError } from "@/lib/providers/duffel";
import { searchHotels } from "@/lib/providers/liteapi";

export const maxDuration = 60;

// Body: { booking, index } — searches hotels for booking.hotels[index].
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const booking = validateBooking(body?.booking);
  const index = Number(body?.index ?? 0);
  const stay = booking?.service === "hotel" ? booking.hotels?.[index] : undefined;
  if (!booking || !stay) {
    return NextResponse.json({ error: "Invalid hotel search." }, { status: 400 });
  }
  try {
    return NextResponse.json({ offers: await searchHotels(stay, booking.travelers) });
  } catch (e) {
    const status = e instanceof ProviderError ? e.status : 500;
    console.error(e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Hotel search failed" }, { status });
  }
}

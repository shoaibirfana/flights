import { NextResponse } from "next/server";
import { ProviderError } from "@/lib/providers/liteapi";
import { searchAirports } from "@/lib/providers/liteapi-airports";
import { duffelEnabled, searchDuffelAirports } from "@/lib/providers/duffel";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ places: [] });
  try {
    // LiteAPI when its key is set; otherwise Duffel, so the site can run on Duffel alone.
    const useDuffel = !process.env.LITEAPI_KEY?.trim() && duffelEnabled();
    const places = await (useDuffel ? searchDuffelAirports : searchAirports)(q.slice(0, 50));
    return NextResponse.json({ places });
  } catch (e) {
    const status = e instanceof ProviderError ? e.status : 500;
    return NextResponse.json({ error: e instanceof Error ? e.message : "Search failed" }, { status });
  }
}

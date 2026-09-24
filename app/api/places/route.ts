import { NextResponse } from "next/server";
import { ProviderError } from "@/lib/providers/liteapi";
import { searchAirports } from "@/lib/providers/liteapi-airports";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ places: [] });
  try {
    return NextResponse.json({ places: await searchAirports(q.slice(0, 50)) });
  } catch (e) {
    const status = e instanceof ProviderError ? e.status : 500;
    return NextResponse.json({ error: e instanceof Error ? e.message : "Search failed" }, { status });
  }
}

import { NextResponse } from "next/server";
import { ProviderError, searchPlaces } from "@/lib/providers/duffel";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ places: [] });
  try {
    return NextResponse.json({ places: await searchPlaces(q.slice(0, 50)) });
  } catch (e) {
    const status = e instanceof ProviderError ? e.status : 500;
    return NextResponse.json({ error: e instanceof Error ? e.message : "Search failed" }, { status });
  }
}

import { NextResponse } from "next/server";
import { getAirports } from "@/lib/providers/liteapi-airports";

export const dynamic = "force-dynamic";

// Setup check: open /api/status in the browser to see whether search is configured and reachable.
// Never returns the key itself.
export async function GET() {
  const key = process.env.LITEAPI_KEY?.trim() ?? "";
  const status: Record<string, unknown> = {
    liteapiKey: key ? (key.startsWith("sand_") ? "set (sandbox)" : key.startsWith("prod_") ? "set (production)" : "set (unknown type)") : "MISSING",
    email: process.env.SMTP_HOST ? "configured" : "not configured (orders are only logged)",
  };
  if (key) {
    try {
      const { airports } = await getAirports();
      status.liteapiConnection = airports.length ? "OK" : "connected, but the airport list came back empty";
      status.airportsLoaded = airports.length;
    } catch (e) {
      status.liteapiConnection = `FAILED: ${e instanceof Error ? e.message : String(e)}`;
    }
  }
  return NextResponse.json(status);
}

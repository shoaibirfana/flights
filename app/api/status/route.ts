import { NextResponse } from "next/server";
import { getAirports } from "@/lib/providers/liteapi-airports";
import { duffelLive, holdsAllowed } from "@/lib/hold";
import { duffelEnabled, searchDuffelAirports } from "@/lib/providers/duffel";

export const dynamic = "force-dynamic";

// Setup check: open /api/status in the browser to see whether search is configured and reachable.
// Never returns the key itself.
export async function GET() {
  const key = process.env.LITEAPI_KEY?.trim() ?? "";
  const status: Record<string, unknown> = {
    liteapiKey: key ? (key.startsWith("sand_") ? "set (sandbox)" : key.startsWith("prod_") ? "set (production)" : "set (unknown type)") : duffelEnabled() ? "not set (not needed: Duffel is used)" : "MISSING",
    flightProvider: duffelEnabled() ? "Duffel (automatic hold bookings)" : "LiteAPI (search only: the team books each order manually)",
    duffel: duffelEnabled()
      ? !duffelLive()
        ? "on (test mode): flights are reserved as hold orders"
        : holdsAllowed()
          ? "on (LIVE mode): every order creates a real airline booking (Duffel bills about $3 each)"
          : "on (LIVE mode, bookings off): live flight data, but orders don't create bookings until DUFFEL_LIVE_HOLDS=on"
      : "off",
    email: process.env.SMTP_HOST ? "configured" : "not configured (orders are only logged)",
    payments: process.env.STRIPE_SECRET_KEY?.trim()
      ? `on (${process.env.STRIPE_SECRET_KEY.trim().includes("_live_") ? "live" : "test"} mode)`
      : "off (orders are submitted without payment)",
    ...(Number(process.env.TEST_ORDER_PRICE) > 0 && { testOrderPrice: `ON: every order costs ${process.env.TEST_ORDER_PRICE} (remove TEST_ORDER_PRICE after testing)` }),
    stripeWebhook: process.env.STRIPE_WEBHOOK_SECRET?.trim() ? "configured" : "not configured (success page sends the emails)",
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
  if (duffelEnabled()) {
    try {
      const places = await searchDuffelAirports("London");
      status.duffelConnection = places.length ? "OK" : "connected, but no airports came back";
    } catch (e) {
      status.duffelConnection = `FAILED: ${e instanceof Error ? e.message : String(e)}`;
    }
  }
  return NextResponse.json(status);
}

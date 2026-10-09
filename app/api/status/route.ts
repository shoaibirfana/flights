import { NextResponse } from "next/server";
import { getAirports } from "@/lib/providers/liteapi-airports";
import { duffelLive, holdsAllowed } from "@/lib/hold";
import { checkMail } from "@/lib/mailer";
import { renderTripSummaryPdf, siteOrigin } from "@/lib/trip-summary-pdf";
import { duffelEnabled, searchDuffelAirports } from "@/lib/providers/duffel";

export const dynamic = "force-dynamic";
// ?pdf=1 also renders a sample trip summary PDF, which takes a few seconds.
export const maxDuration = 60;

// A sample order for the ?pdf=1 check.
const SAMPLE_ITINERARY = {
  booking: { service: "flight" as const, tripType: "oneway" as const, travelers: 1, cabin: "economy" as const, excludeTransit: [],
    legs: [{ from: "Karachi (KHI)", fromCode: "KHI", to: "Lahore (LHE)", toCode: "LHE", date: "2026-12-01" }] },
  travelers: [{ firstName: "Test", lastName: "Traveler" }],
  segments: [{ flightNumber: "PK303", airline: "Pakistan International Airlines", from: "KHI", fromName: "Karachi", to: "LHE",
    toName: "Lahore", departAt: "2026-12-01T07:00:00", arriveAt: "2026-12-01T08:50:00" }],
  codes: { reservation: "TEST01", airline: "0000000000000T0" },
};

// Setup check: open /api/status in the browser to see whether search is configured and reachable.
// Never returns the key itself.
export async function GET(req: Request) {
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
  Object.assign(status, await checkMail());
  if (new URL(req.url).searchParams.get("pdf") === "1") {
    const started = Date.now();
    try {
      const pdf = await renderTripSummaryPdf(SAMPLE_ITINERARY, siteOrigin(new URL(req.url).origin));
      status.tripSummaryPdf = `OK (${Math.round(pdf.length / 1024)} KB in ${Date.now() - started} ms)`;
    } catch (e) {
      status.tripSummaryPdf = `FAILED after ${Date.now() - started} ms: ${e instanceof Error ? e.message : String(e)}`;
    }
  } else {
    status.tripSummaryPdf = "add ?pdf=1 to the address to test it";
  }
  return NextResponse.json(status);
}

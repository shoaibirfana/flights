// Renders the trip summary page (/order/summary, components/TripSummary.tsx) to a PDF on the server,
// exactly as the customer's "Print / Save as PDF" button does, so it can be attached to their email.
// The page reads the order from sessionStorage, so the same keys are filled in before it loads.
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
import { encodeBooking } from "./booking";
import type { Itinerary } from "./itinerary";

// The site's public address; the order route passes the address the request came in on.
export function siteOrigin(fallback?: string): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (configured) return configured;
  if (fallback) return fallback;
  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  return production ? `https://${production}` : "http://localhost:3000";
}

export async function renderTripSummaryPdf(itinerary: Itinerary, origin: string): Promise<Uint8Array> {
  const encoded = encodeBooking(itinerary.booking);
  // CHROME_PATH runs a locally installed Chrome (for testing); on Vercel the bundled Chromium is used.
  const local = process.env.CHROME_PATH?.trim();
  const browser = await puppeteer.launch(
    local
      ? { executablePath: local, headless: true, args: ["--no-sandbox"] }
      : {
          args: await puppeteer.defaultArgs({ args: chromium.args, headless: "shell" }),
          executablePath: await chromium.executablePath(),
          headless: "shell",
        },
  );
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1000, height: 1400 });
    const storage: Record<string, string> = {
      "booking-selections": JSON.stringify({ booking: encoded, selections: [{ ref: "", summary: [], segments: itinerary.segments }] }),
      "booking-travelers": JSON.stringify({ booking: encoded, travelers: itinerary.travelers }),
      [`trip-codes:${encoded}`]: JSON.stringify(itinerary.codes),
    };
    await page.evaluateOnNewDocument((items: Record<string, string>) => {
      for (const [key, value] of Object.entries(items)) sessionStorage.setItem(key, value);
    }, storage);
    await page.goto(`${origin}/order/summary?b=${encodeURIComponent(encoded)}`, { waitUntil: "networkidle0", timeout: 30000 });
    await page.waitForSelector(".itinerary-page", { timeout: 15000 });
    return await page.pdf({ format: "A4", printBackground: true, preferCSSPageSize: true });
  } finally {
    await browser.close();
  }
}

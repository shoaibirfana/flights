// Builds the flight itinerary PDF that is attached to the customer's confirmation email.
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { FlightSegment, Order } from "./booking";
import { site } from "./site";

export type Itinerary = {
  travelers: string[];
  segments: FlightSegment[];
};

export function itineraryFor(order: Order): Itinerary {
  return {
    travelers: order.travelers.map((t) => `${t.firstName} ${t.lastName}`),
    segments: order.selections.flatMap((s) => s.segments ?? []),
  };
}

// The built-in PDF fonts only cover Latin-1, so accents are stripped and anything else is replaced.
const safe = (s: string) =>
  (s || "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\x20-\x7E]/g, "?");

const dateLabel = (iso: string) => {
  const d = new Date(iso.slice(0, 10) + "T00:00:00Z");
  return Number.isNaN(d.getTime())
    ? iso.slice(0, 10)
    : d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
};
const timeLabel = (iso: string) => iso.slice(11, 16);

const TEXT = rgb(0.13, 0.13, 0.13);
const DIM = rgb(0.4, 0.4, 0.4);
const BORDER = rgb(0.83, 0.83, 0.83);
const NAVY = rgb(0.09, 0.19, 0.24);

export async function buildItineraryPdf(
  orderId: string,
  itinerary: Itinerary,
  pnr?: string | null,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`${site.name} itinerary ${orderId}`);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const W = 595;
  const H = 842;
  const M = 48;
  let page: PDFPage = doc.addPage([W, H]);
  let y = H - M;

  const text = (s: string, x: number, size: number, f: PDFFont = font, color = TEXT, maxWidth = W - M - x) => {
    let t = safe(s);
    // Shorten long names (e.g. airports) to fit their column
    if (f.widthOfTextAtSize(t, size) > maxWidth) {
      while (t.length > 1 && f.widthOfTextAtSize(t + "...", size) > maxWidth) t = t.slice(0, -1);
      t += "...";
    }
    page.drawText(t, { x, y, size, font: f, color });
  };
  const ensure = (needed: number) => {
    if (y - needed < M) {
      page = doc.addPage([W, H]);
      y = H - M;
    }
  };

  // Header
  page.drawRectangle({ x: 0, y: H - 80, width: W, height: 80, color: NAVY });
  y = H - 46;
  text(site.name, M, 22, bold, rgb(1, 1, 1));
  text("Flight Itinerary", W - M - bold.widthOfTextAtSize("Flight Itinerary", 14), 14, bold, rgb(1, 1, 1));
  y = H - 110;

  text("Order ID", M, 10, font, DIM);
  text("Issued", W / 2, 10, font, DIM);
  y -= 15;
  text(orderId, M, 13, bold);
  text(dateLabel(new Date().toISOString()), W / 2, 13, bold);
  y -= 22;
  if (pnr) {
    text("Airline booking reference (PNR)", M, 10, font, DIM);
    y -= 15;
    text(pnr, M, 13, bold);
    y -= 22;
  }

  // Travelers
  y -= 8;
  text("TRAVELER(S)", M, 11, bold);
  y -= 8;
  page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 1, color: BORDER });
  y -= 16;
  itinerary.travelers.forEach((name, i) => {
    ensure(16);
    text(`${i + 1}. ${name.toUpperCase()}`, M, 12, bold);
    y -= 16;
  });
  y -= 10;

  // Flights
  ensure(40);
  text("FLIGHTS", M, 11, bold);
  y -= 8;
  page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 1, color: BORDER });
  y -= 14;

  const BOX = 112;
  const col = (W - 2 * M - 24 - 40) / 2;
  for (const seg of itinerary.segments) {
    ensure(BOX + 12);
    const top = y;
    page.drawRectangle({ x: M, y: top - BOX, width: W - 2 * M, height: BOX, borderColor: BORDER, borderWidth: 1 });

    y = top - 18;
    text(`${seg.flightNumber}  -  ${seg.airline}`, M + 12, 12, bold);
    if (seg.operatedBy) {
      y -= 13;
      text(`Operated by ${seg.operatedBy}`, M + 12, 9, font, DIM);
    }

    const left = M + 12;
    const right = M + 12 + col + 40;
    y = top - 62;
    text(seg.from, left, 20, bold, TEXT, col);
    text(seg.to, right, 20, bold, TEXT, col);
    text("->", left + col + 6, 14, bold, DIM, 30);
    y -= 14;
    text(seg.fromName, left, 9, font, DIM, col);
    text(seg.toName, right, 9, font, DIM, col);
    y -= 18;
    text(`Depart ${timeLabel(seg.departAt)}  ${dateLabel(seg.departAt)}`, left, 11, bold, TEXT, col);
    text(`Arrive ${timeLabel(seg.arriveAt)}  ${dateLabel(seg.arriveAt)}`, right, 11, bold, TEXT, col);

    y = top - BOX - 12;
  }

  // Footer note
  ensure(50);
  y -= 6;
  for (const line of [
    "Times are local to each airport.",
    "This is a flight reservation for visa purposes, not a paid ticket.",
    `Questions? Contact us at ${site.email}.`,
  ]) {
    text(line, M, 9, font, DIM);
    y -= 13;
  }

  return doc.save();
}

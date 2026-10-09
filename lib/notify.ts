import type { Itinerary } from "./itinerary";
import { buildItineraryPdf } from "./itinerary-pdf";
import { sendMail, type Attachment } from "./mailer";
import { customerSummary } from "./orders";
import { site } from "./site";
import { renderTripSummaryPdf } from "./trip-summary-pdf";

// Which PDF the order emails attach:
// - default: the simple itinerary drawn in lib/itinerary-pdf.ts
// - TRIP_PDF=summary (Vercel environment variable): the trip summary page (components/TripSummary.tsx),
//   falling back to the simple itinerary if that page can't be rendered
const useSummaryPage = () => process.env.TRIP_PDF?.trim().toLowerCase() === "summary";

// The PDF for the emails plus a note for the team saying which PDF was attached, or why none was.
async function pdfAttachment(
  orderId: string,
  itinerary: Itinerary | null | undefined,
  origin: string,
): Promise<{ pdf: Attachment | null; note: string }> {
  if (!itinerary?.segments.length) return { pdf: null, note: "not attached (the order has no flight details)" };
  let problem = "";
  if (useSummaryPage()) {
    try {
      const content = await renderTripSummaryPdf(itinerary, origin);
      return {
        pdf: { filename: `trip-summary-${orderId}.pdf`, content, contentType: "application/pdf" },
        note: "trip summary page attached",
      };
    } catch (e) {
      problem = `trip summary page failed (${e instanceof Error ? e.message : String(e)}), `;
      console.error("Trip summary PDF failed", orderId, e);
    }
  }
  try {
    const content = await buildItineraryPdf(orderId, itinerary);
    return {
      pdf: { filename: `itinerary-${orderId}.pdf`, content, contentType: "application/pdf" },
      note: `${problem}itinerary attached`,
    };
  } catch (e) {
    console.error("Itinerary PDF failed", orderId, e);
    return { pdf: null, note: `${problem}not attached (${e instanceof Error ? e.message : String(e)})` };
  }
}

// Sends the new-order email to the business and the confirmation (with the PDF) to the customer.
export async function sendOrderEmails(
  orderId: string,
  summary: string,
  customerEmail: string,
  service: string,
  itinerary: Itinerary | null | undefined,
  origin: string,
) {
  const { pdf, note } = await pdfAttachment(orderId, itinerary, origin);
  const attachments = pdf ? [pdf] : undefined;
  await sendMail(
    process.env.ORDER_NOTIFY_EMAIL?.trim() || site.orderEmail,
    `New order ${orderId}: ${service} reservation`,
    `PDF: ${note}\n\n${summary}`,
    customerEmail,
    attachments,
  );
  await sendMail(
    customerEmail,
    `We received your order ${orderId}`,
    `Thank you for your order with ${site.name}.\n\n${
      pdf ? "Your flight itinerary is attached as a PDF.\n\n" : ""
    }Our team will contact you shortly to confirm your reservation.\n\n${customerSummary(summary)}\n\nQuestions? Reply to this email or contact us at ${site.email}.`,
    undefined,
    attachments,
  );
}

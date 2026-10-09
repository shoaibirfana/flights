import type { Itinerary } from "./itinerary";
import { sendMail, type Attachment } from "./mailer";
import { customerSummary } from "./orders";
import { site } from "./site";
import { renderTripSummaryPdf } from "./trip-summary-pdf";

// The trip summary page as a PDF for the emails; null when there are no flights or rendering fails.
async function tripSummaryAttachment(orderId: string, itinerary: Itinerary | null | undefined, origin: string) {
  if (!itinerary?.segments.length) return null;
  try {
    const content = await renderTripSummaryPdf(itinerary, origin);
    return { filename: `trip-summary-${orderId}.pdf`, content, contentType: "application/pdf" } satisfies Attachment;
  } catch (e) {
    console.error("Trip summary PDF failed", orderId, e);
    return null;
  }
}

// Sends the new-order email to the business and the confirmation (with the trip summary PDF) to the customer.
export async function sendOrderEmails(
  orderId: string,
  summary: string,
  customerEmail: string,
  service: string,
  itinerary: Itinerary | null | undefined,
  origin: string,
) {
  const pdf = await tripSummaryAttachment(orderId, itinerary, origin);
  const attachments = pdf ? [pdf] : undefined;
  await sendMail(
    process.env.ORDER_NOTIFY_EMAIL?.trim() || site.orderEmail,
    `New order ${orderId}: ${service} reservation`,
    summary,
    customerEmail,
    attachments,
  );
  await sendMail(
    customerEmail,
    `We received your order ${orderId}`,
    `Thank you for your order with ${site.name}.\n\n${
      pdf ? "Your trip summary is attached as a PDF.\n\n" : ""
    }Our team will contact you shortly to confirm your reservation.\n\n${customerSummary(summary)}\n\nQuestions? Reply to this email or contact us at ${site.email}.`,
    undefined,
    attachments,
  );
}

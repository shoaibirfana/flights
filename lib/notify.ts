import { buildItineraryPdf, type Itinerary } from "./itinerary-pdf";
import { sendMail, type Attachment } from "./mailer";
import { customerSummary } from "./orders";
import { site } from "./site";

// The itinerary PDF for the customer's email; null when there are no flights or the PDF fails.
async function itineraryAttachment(orderId: string, itinerary?: Itinerary | null, pnr?: string | null) {
  if (!itinerary?.segments.length) return null;
  try {
    const content = await buildItineraryPdf(orderId, itinerary, pnr);
    return { filename: `itinerary-${orderId}.pdf`, content, contentType: "application/pdf" } satisfies Attachment;
  } catch (e) {
    console.error("Itinerary PDF failed", orderId, e);
    return null;
  }
}

// Sends the new-order email to the business and the confirmation (with the itinerary PDF) to the customer.
export async function sendOrderEmails(
  orderId: string,
  summary: string,
  customerEmail: string,
  service: string,
  itinerary?: Itinerary | null,
  pnr?: string | null,
) {
  const pdf = await itineraryAttachment(orderId, itinerary, pnr);
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
      pdf ? "Your flight itinerary is attached as a PDF.\n\n" : ""
    }Our team will contact you shortly to confirm your reservation.\n\n${customerSummary(summary)}\n\nQuestions? Reply to this email or contact us at ${site.email}.`,
    undefined,
    attachments,
  );
}

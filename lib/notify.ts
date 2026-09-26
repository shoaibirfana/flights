import { sendMail } from "./mailer";
import { site } from "./site";

// Sends the new-order email to the business and the confirmation to the customer.
export async function sendOrderEmails(orderId: string, summary: string, customerEmail: string, service: string) {
  await sendMail(
    process.env.ORDER_NOTIFY_EMAIL || site.email,
    `New order ${orderId}: ${service} reservation`,
    summary,
    customerEmail,
  );
  await sendMail(
    customerEmail,
    `We received your order ${orderId}`,
    `Thank you for your order with ${site.name}.\n\nOur team will contact you shortly to confirm your reservation.\n\n${summary}\n\nQuestions? Reply to this email or contact us at ${site.email}.`,
  );
}

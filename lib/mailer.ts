import nodemailer from "nodemailer";

function transport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST) return null;
  const port = Number(SMTP_PORT || 587);
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  });
}

// Sends an email if SMTP is configured; otherwise logs it so orders are never silently lost.
export async function sendMail(to: string, subject: string, text: string, replyTo?: string) {
  const t = transport();
  if (!t) {
    console.log(`[mail disabled] To: ${to}\nSubject: ${subject}\n\n${text}`);
    return;
  }
  await t.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
    replyTo,
  });
}

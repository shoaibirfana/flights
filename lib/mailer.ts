import nodemailer from "nodemailer";

// Values pasted into Vercel often carry stray spaces or line breaks, so every setting is trimmed.
const env = (name: string) => process.env[name]?.trim() || "";

function transport() {
  const host = env("SMTP_HOST");
  if (!host) return null;
  const port = Number(env("SMTP_PORT") || 587);
  const user = env("SMTP_USER");
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: user ? { user, pass: env("SMTP_PASS") } : undefined,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
  });
}

// For /api/status: logs in to the mail server without sending anything. Never returns the password.
export async function checkMail(): Promise<Record<string, string>> {
  const t = transport();
  if (!t) return { email: "not configured (orders are only logged)" };
  const user = env("SMTP_USER");
  const from = env("MAIL_FROM") || user;
  const fromAddress = (from.match(/<([^>]+)>/)?.[1] ?? from).trim().toLowerCase();
  const result: Record<string, string> = {
    emailServer: `${env("SMTP_HOST")}:${env("SMTP_PORT") || 587}`,
    emailUser: user || "MISSING (SMTP_USER)",
    emailPassword: env("SMTP_PASS") ? "set" : "MISSING (SMTP_PASS)",
    emailFrom: from,
    orderEmailsGoTo: env("ORDER_NOTIFY_EMAIL") || "(site default in lib/site.ts)",
  };
  if (user && fromAddress !== user.toLowerCase()) {
    result.emailFromWarning = "MAIL_FROM uses a different address than SMTP_USER; most mail servers reject that";
  }
  try {
    await t.verify();
    result.emailLogin = "OK";
  } catch (e) {
    result.emailLogin = `FAILED: ${e instanceof Error ? e.message : String(e)}`;
  }
  return result;
}

export type Attachment = { filename: string; content: Uint8Array; contentType: string };

// Sends an email if SMTP is configured; otherwise logs it so orders are never silently lost.
export async function sendMail(to: string, subject: string, text: string, replyTo?: string, attachments?: Attachment[]) {
  const t = transport();
  if (!t) {
    const files = attachments?.length ? `\n[attachments: ${attachments.map((a) => a.filename).join(", ")}]` : "";
    console.log(`[mail disabled] To: ${to}\nSubject: ${subject}\n\n${text}${files}`);
    return;
  }
  await t.sendMail({
    from: env("MAIL_FROM") || env("SMTP_USER"),
    to,
    subject,
    text,
    replyTo,
    attachments: attachments?.map((a) => ({ ...a, content: Buffer.from(a.content) })),
  });
}

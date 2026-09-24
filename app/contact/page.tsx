import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import { site, whatsappLink } from "@/lib/site";

export const metadata: Metadata = { title: "Contact Us" };

export default function ContactPage() {
  const cards = [
    { icon: "💬", title: "WhatsApp", text: site.phoneDisplay, href: whatsappLink() },
    { icon: "✉️", title: "Email", text: site.email, href: `mailto:${site.email}` },
    { icon: "📍", title: "Office", text: site.address },
  ];
  return (
    <>
      <PageHeader title="Contact Us" subtitle="We're here to help with your visa reservation." />
      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-16 md:grid-cols-3">
        {cards.map((c) => {
          const body = (
            <>
              <div className="text-4xl">{c.icon}</div>
              <h2 className="mt-4 text-lg font-semibold">{c.title}</h2>
              <p className="mt-1 break-words text-gray-600">{c.text}</p>
            </>
          );
          return c.href ? (
            <a
              key={c.title}
              href={c.href}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-100 transition hover:ring-brand-600"
            >
              {body}
            </a>
          ) : (
            <div key={c.title} className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-100">
              {body}
            </div>
          );
        })}
      </div>
    </>
  );
}

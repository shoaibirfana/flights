import type { Metadata } from "next";
import Icon, { type IconName } from "@/components/Icon";
import PageHeader from "@/components/PageHeader";
import Reveal from "@/components/Reveal";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Contact Us" };

export default function ContactPage() {
  const cards: { icon: IconName; title: string; text: string; href?: string }[] = [
    { icon: "mail", title: "Email", text: site.email, href: `mailto:${site.email}` },
  ];
  return (
    <>
      <PageHeader title="Contact Us" subtitle="We're here to help with your visa reservation." />
      <div className="mx-auto grid max-w-md gap-6 px-4 py-16">
        {cards.map((c, i) => {
          const body = (
            <>
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-cream">
                <Icon name={c.icon} className="h-6 w-6" />
              </span>
              <h2 className="mt-4 text-lg font-semibold">{c.title}</h2>
              <p className="mt-1 break-words text-gray-600">{c.text}</p>
            </>
          );
          return (
            <Reveal key={c.title} delay={i * 100}>
              {c.href ? (
                <a
                  href={c.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card-lift block h-full rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-100 hover:ring-brand-600"
                >
                  {body}
                </a>
              ) : (
                <div className="h-full rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-100">{body}</div>
              )}
            </Reveal>
          );
        })}
      </div>
    </>
  );
}

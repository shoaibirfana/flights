"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Logo from "./Logo";

const links = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About Us" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 bg-white/90 backdrop-blur-md transition-shadow duration-300 print:hidden ${
        scrolled ? "shadow-[0_8px_30px_-12px_rgb(23_49_62_/_0.25)]" : "border-b border-gray-100"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Logo />
        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`group relative text-sm font-medium transition hover:text-brand-600 ${
                pathname === l.href ? "text-brand-600" : "text-navy-900"
              }`}
            >
              {l.label}
              <span
                className={`absolute -bottom-1.5 left-0 h-0.5 rounded-full bg-brand-600 transition-all duration-300 ${
                  pathname === l.href ? "w-full" : "w-0 group-hover:w-full"
                }`}
              />
            </Link>
          ))}
          <Link href="/#book" className="btn-primary !px-5 !py-2 text-sm">
            Book Now
          </Link>
        </nav>
        <button className="rounded-md p-2 md:hidden" aria-label="Toggle menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
          </svg>
        </button>
      </div>
      <div
        className={`grid overflow-hidden border-gray-100 bg-white transition-all duration-300 md:hidden ${
          open ? "grid-rows-[1fr] border-t" : "grid-rows-[0fr]"
        }`}
      >
        <nav className="min-h-0 px-4">
          <div className="py-3">
            {links.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="block py-2 font-medium text-navy-900">
                {l.label}
              </Link>
            ))}
            <Link href="/#book" onClick={() => setOpen(false)} className="btn-primary mt-2 w-full text-sm">
              Book Now
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}

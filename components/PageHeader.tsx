import { LogoMark } from "./Logo";

// Banner at the top of inner pages (About, FAQ, Contact, policies).
export default function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-brand-700 to-brand-500 py-16 text-center text-white md:py-20">
      <div className="float-slow pointer-events-none absolute -top-20 -left-20 h-72 w-72 rounded-full bg-white/5 blur-2xl" />
      <LogoMark
        className="pointer-events-none absolute -right-8 -bottom-10 h-48 w-auto opacity-[0.07]"
        color="#f3e2d4"
        accent="#17313e"
      />
      <div className="hero-in relative">
        <h1 className="px-4 text-3xl font-bold tracking-tight md:text-5xl">{title}</h1>
        {subtitle && <p className="mx-auto mt-4 max-w-2xl px-4 text-white/80 md:text-lg">{subtitle}</p>}
      </div>
    </div>
  );
}

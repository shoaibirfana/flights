import Reveal from "./Reveal";

// Standard section title: small eyebrow label, heading and optional intro line.
export default function SectionHeading({
  eyebrow,
  title,
  intro,
  light = false,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  light?: boolean;
}) {
  return (
    <Reveal className="mx-auto max-w-2xl text-center">
      <p className={`text-xs font-semibold tracking-[0.2em] uppercase ${light ? "text-cream/80" : "text-brand-500"}`}>
        {eyebrow}
      </p>
      <h2 className={`mt-3 text-3xl font-bold tracking-tight md:text-4xl ${light ? "text-white" : "text-navy-900"}`}>
        {title}
      </h2>
      {intro && <p className={`mt-4 text-base md:text-lg ${light ? "text-white/75" : "text-gray-600"}`}>{intro}</p>}
    </Reveal>
  );
}

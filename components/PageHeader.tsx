export default function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="bg-gradient-to-br from-brand-700 to-brand-500 py-14 text-center text-white">
      <h1 className="px-4 text-3xl font-bold md:text-4xl">{title}</h1>
      {subtitle && <p className="mx-auto mt-3 max-w-2xl px-4 text-white/85">{subtitle}</p>}
    </div>
  );
}

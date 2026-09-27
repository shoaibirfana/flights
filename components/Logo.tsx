import Link from "next/link";
import { site } from "@/lib/site";

// Viza Bunny logo mark (vector, from the brand guide). `color` is the mark, `accent` the dot's centre.
export function LogoMark({
  className = "h-9 w-auto",
  color = "#17313e",
  accent = "#f3e2d4",
}: {
  className?: string;
  color?: string;
  accent?: string;
}) {
  return (
    <svg viewBox="300.9 319.0 478.2 442.0" className={className} role="img" aria-label={site.name}>
      <path transform="matrix(1,0,0,-1,741.1815,322.9834)" d="M0 0V-280.094L-43.693-236.4-136.285-143.808-179.389-100.705H-117.58L-43.693-174.591V0Z" fill={color} />
      <path transform="matrix(1,0,0,-1,775.0866,683.2318)" d="M0 0H-55.608L-113.066 57.926-157.876 101.907C-160.114 104.255-163.427 108.599-169.23 114.48-191.471 137.014-212.917 154.076-245.834 154.93-300.141 156.353-345.238 116.604-346.539 66.16-347.86 15.696-304.879-26.33-250.551-27.733-224.404-28.424-200.413-19.559-182.399-4.575-170.83 5.042-161.741 17.201-156.13 30.986L-126.953 1.81C-133.602-11.467-142.446-23.524-153.039-33.914-178.109-58.536-212.917-73.785-251.385-73.785-327.793-73.785-389.744-13.602-389.744 60.63-389.744 134.862-327.793 195.045-251.385 195.045-205.008 195.045-171.216 172.492-138.868 138.868Z" fill={color} />
      <path transform="matrix(1,0,0,-1,361.7845,687.11306)" d="M0 0C0-15.705-12.731-28.436-28.436-28.436-44.14-28.436-56.871-15.705-56.871 0-56.871 15.705-44.14 28.436-28.436 28.436-12.731 28.436 0 15.705 0 0" fill={color} />
      <path transform="matrix(1,0,0,-1,344.0003,688.1336)" d="M0 0C0-6.58-5.334-11.914-11.914-11.914-18.493-11.914-23.827-6.58-23.827 0-23.827 6.58-18.493 11.914-11.914 11.914-5.334 11.914 0 6.58 0 0" fill={accent} />
    </svg>
  );
}

export default function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label={`${site.name} home`}>
      <LogoMark className="h-9 w-auto" color={light ? "#f3e2d4" : "#17313e"} accent={light ? "#17313e" : "#f3e2d4"} />
      <span className={`text-xl font-medium tracking-[0.08em] ${light ? "text-cream" : "text-navy-900"}`}>
        {site.name.toUpperCase()}
      </span>
    </Link>
  );
}

const schengen = "AT BE BG HR CZ DK EE FI FR DE GR HU IS IT LV LI LT LU MT NL NO PL PT RO SK SI ES SE CH".split(" ");

// Countries customers commonly want to avoid transiting (transit visa often required).
export const transitGroups: { label: string; codes: string[] }[] = [
  { label: "United States", codes: ["US"] },
  { label: "United Kingdom", codes: ["GB"] },
  { label: "Canada", codes: ["CA"] },
  { label: "Schengen countries", codes: schengen },
  { label: "Ireland", codes: ["IE"] },
  { label: "Australia", codes: ["AU"] },
];

export function transitCodes(labels: string[]): Set<string> {
  return new Set(transitGroups.filter((g) => labels.includes(g.label)).flatMap((g) => g.codes));
}

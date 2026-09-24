// Airport list from GET /data/iataCodes, cached for a day and searched in memory.
import { lite } from "./liteapi";

type RawAirport = { code?: string; iata?: string; name?: string; countryCode?: string; country?: string };
export type Airport = { code: string; name: string; countryCode: string };
export type Place = { code: string; label: string };

let cache: { at: number; airports: Airport[]; byCode: Map<string, Airport> } | null = null;
const DAY = 24 * 60 * 60 * 1000;

export async function getAirports() {
  if (cache && Date.now() - cache.at < DAY) return cache;
  const { data = [] } = await lite<{ data?: RawAirport[] }>("/data/iataCodes");
  const airports = data
    .map((a) => ({
      code: String(a.code ?? a.iata ?? "").toUpperCase(),
      name: String(a.name ?? ""),
      countryCode: String(a.countryCode ?? a.country ?? "").toUpperCase(),
    }))
    .filter((a) => /^[A-Z]{3}$/.test(a.code) && a.name);
  cache = { at: Date.now(), airports, byCode: new Map(airports.map((a) => [a.code, a])) };
  return cache;
}

const countryNames = new Intl.DisplayNames(["en"], { type: "region" });
const countryName = (cc: string) => {
  try {
    return cc ? countryNames.of(cc) ?? cc : "";
  } catch {
    return cc;
  }
};

export async function searchAirports(query: string): Promise<Place[]> {
  const q = query.trim().toLowerCase();
  const { airports } = await getAirports();
  const scored: { a: Airport; score: number }[] = [];
  for (const a of airports) {
    const name = a.name.toLowerCase();
    let score = -1;
    if (a.code.toLowerCase() === q) score = 0;
    else if (name.startsWith(q)) score = 1;
    else if (name.split(/[\s\-/(),]+/).some((w) => w.startsWith(q))) score = 2;
    else if (countryName(a.countryCode).toLowerCase().startsWith(q)) score = 3;
    if (score >= 0) scored.push({ a, score });
  }
  return scored
    .sort((x, y) => x.score - y.score || x.a.name.localeCompare(y.a.name))
    .slice(0, 10)
    .map(({ a }) => ({ code: a.code, label: `${a.name} (${a.code})${a.countryCode ? `, ${countryName(a.countryCode)}` : ""}` }));
}

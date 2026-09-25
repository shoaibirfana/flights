// Airport list from GET /data/iataCodes, cached for a day and searched in memory.
// LiteAPI gives airport names only, so city names come from a bundled IATA → city lookup built from
// OpenFlights (https://openflights.org/data, ODbL) with gaps filled from OurAirports
// (https://ourairports.com/data, public domain).
import cityByCode from "../data/airport-cities.json";
import { lite } from "./liteapi";

type RawAirport = { code?: string; iata?: string; name?: string; countryCode?: string; country?: string };
export type Airport = { code: string; name: string; city: string; countryCode: string };
export type Place = { code: string; label: string };

const cities = cityByCode as Record<string, string>;

let cache: { at: number; airports: Airport[]; byCode: Map<string, Airport> } | null = null;
const DAY = 24 * 60 * 60 * 1000;

export async function getAirports() {
  if (cache && Date.now() - cache.at < DAY) return cache;
  const { data = [] } = await lite<{ data?: RawAirport[] }>("/data/iataCodes");
  const airports = data
    .map((a) => {
      const code = String(a.code ?? a.iata ?? "").toUpperCase();
      return {
        code,
        name: String(a.name ?? ""),
        city: cities[code] ?? "",
        countryCode: String(a.countryCode ?? a.country ?? "").toUpperCase(),
      };
    })
    .filter((a) => /^[A-Z]{3}$/.test(a.code) && a.name);
  if (airports.length === 0) console.error("LiteAPI /data/iataCodes: no usable airports; sample:", JSON.stringify(data.slice(0, 2)));
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

const words = (s: string) => s.toLowerCase().split(/[\s\-/(),.]+/);

export async function searchAirports(query: string): Promise<Place[]> {
  const q = query.trim().toLowerCase();
  const { airports } = await getAirports();
  const scored: { a: Airport; score: number }[] = [];
  for (const a of airports) {
    const city = a.city.toLowerCase();
    let score = -1;
    if (a.code.toLowerCase() === q) score = 0;
    else if (city === q) score = 1;
    else if (city.startsWith(q)) score = 2;
    else if (a.name.toLowerCase().startsWith(q)) score = 3;
    else if (words(a.city).some((w) => w.startsWith(q)) || words(a.name).some((w) => w.startsWith(q))) score = 4;
    else if (countryName(a.countryCode).toLowerCase().startsWith(q)) score = 5;
    if (score >= 0) scored.push({ a, score });
  }
  return scored
    .sort((x, y) => x.score - y.score || (x.a.city || x.a.name).localeCompare(y.a.city || y.a.name))
    .slice(0, 10)
    .map(({ a }) => {
      const country = countryName(a.countryCode);
      // e.g. "Lahore (LHE) - Allama Iqbal International Airport, Pakistan"
      const label = a.city
        ? `${a.city} (${a.code}) - ${a.name}${country ? `, ${country}` : ""}`
        : `${a.name} (${a.code})${country ? `, ${country}` : ""}`;
      return { code: a.code, label };
    });
}

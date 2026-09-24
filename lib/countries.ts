// ISO 3166-1 alpha-2 codes; names come from the browser/Node Intl API.
const codes =
  "AD AE AF AG AI AL AM AO AR AS AT AU AW AZ BA BB BD BE BF BG BH BI BJ BM BN BO BR BS BT BW BY BZ CA CD CF CG CH CI CK CL CM CN CO CR CU CV CW CY CZ DE DJ DK DM DO DZ EC EE EG ER ES ET FI FJ FM FO FR GA GB GD GE GF GH GI GL GM GN GP GQ GR GT GU GW GY HK HN HR HT HU ID IE IL IN IQ IR IS IT JM JO JP KE KG KH KI KM KN KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NG NI NL NO NP NR NZ OM PA PE PF PG PH PK PL PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SI SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TG TH TJ TL TM TN TO TR TT TV TW TZ UA UG US UY UZ VC VE VG VI VN VU WS XK YE ZA ZM ZW".split(
    " ",
  );

const names = new Intl.DisplayNames(["en"], { type: "region" });

export const countries: { code: string; name: string }[] = codes
  .map((code) => ({ code, name: code === "XK" ? "Kosovo" : names.of(code) || code }))
  .sort((a, b) => a.name.localeCompare(b.name));

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

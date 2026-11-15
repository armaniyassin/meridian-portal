import "server-only";
import { getOrFetch, type Cached } from "@/lib/cache";

export type FredPoint = { series: string; value: number | null; date: string | null; prev?: number | null; prevDate?: string | null };
export const FRED_SERIES = { DGS2: "US 2-year Treasury", DGS10: "US 10-year Treasury", VIXCLS: "VIX" } as const;

/** Government 10-year yields of other countries: OECD monthly series republished by FRED. Monthly and lagged by 1 to 2 months, so every row shows its month. */
export const INTL_BONDS: [string, string, string][] = [
  ["IRLTLT01CAM156N", "Canada 10-year", "Americas"], ["IRLTLT01MXM156N", "Mexico 10-year", "Americas"], ["IRLTLT01BRM156N", "Brazil 10-year", "Americas"],
  ["IRLTLT01GBM156N", "UK 10-year gilt", "Europe"], ["IRLTLT01DEM156N", "Germany 10-year Bund", "Europe"], ["IRLTLT01FRM156N", "France 10-year", "Europe"],
  ["IRLTLT01ITM156N", "Italy 10-year", "Europe"], ["IRLTLT01ESM156N", "Spain 10-year", "Europe"], ["IRLTLT01CHM156N", "Switzerland 10-year", "Europe"],
  ["IRLTLT01JPM156N", "Japan 10-year JGB", "Asia-Pacific"], ["IRLTLT01AUM156N", "Australia 10-year", "Asia-Pacific"], ["IRLTLT01KRM156N", "South Korea 10-year", "Asia-Pacific"], ["IRLTLT01INM156N", "India 10-year", "Asia-Pacific"],
  ["IRLTLT01ZAM156N", "South Africa 10-year", "Africa"],
];
/** Macro indicators from FRED. `units` is the FRED transformation (pc1 = percent change from a year ago). `unit` is only how the number is written. */
export type MacroDef = { id: string; label: string; group: string; unit: string; units?: string; note: string; home?: boolean };
export const MACRO: MacroDef[] = [
  { id: "VIXCLS", label: "VIX", group: "Volatility and credit", unit: "", note: "Expected 30-day stock volatility (S&P 500 options)", home: true },
  { id: "BAMLH0A0HYM2", label: "High-yield credit spread", group: "Volatility and credit", unit: "pp", note: "Extra yield junk bonds pay over Treasuries", home: true },
  { id: "STLFSI4", label: "Financial stress index", group: "Volatility and credit", unit: "", note: "St. Louis Fed index: above 0 means above-average stress" },
  { id: "NFCI", label: "Financial conditions index", group: "Volatility and credit", unit: "", note: "Chicago Fed: above 0 means tighter than average" },
  { id: "T10Y2Y", label: "Yield curve, 10y minus 2y", group: "Rates and inflation", unit: "pp", note: "Negative means an inverted curve", home: true },
  { id: "T10Y3M", label: "Yield curve, 10y minus 3m", group: "Rates and inflation", unit: "pp", note: "Another common recession gauge" },
  { id: "DFF", label: "Fed funds rate", group: "Rates and inflation", unit: "%", note: "Effective overnight rate set around the Fed target", home: true },
  { id: "T5YIE", label: "5-year breakeven inflation", group: "Rates and inflation", unit: "%", note: "Inflation the bond market is pricing in" },
  { id: "CPIAUCSL", label: "Consumer prices (CPI), yearly", group: "Rates and inflation", unit: "%", units: "pc1", note: "Change from a year ago", home: true },
  { id: "PCEPI", label: "PCE prices, yearly", group: "Rates and inflation", unit: "%", units: "pc1", note: "The Fed’s preferred inflation gauge" },
  { id: "A191RL1Q225SBEA", label: "GDP growth, quarterly annualised", group: "Growth and jobs", unit: "%", note: "Real GDP, quarter on quarter, annualised" },
  { id: "UNRATE", label: "Unemployment rate", group: "Growth and jobs", unit: "%", note: "Share of the labour force without a job", home: true },
  { id: "ICSA", label: "Initial jobless claims", group: "Growth and jobs", unit: "K", note: "New unemployment claims, weekly" },
  { id: "UMCSENT", label: "Consumer sentiment", group: "Growth and jobs", unit: "", note: "University of Michigan survey index" },
  { id: "DTWEXBGS", label: "US dollar index (broad)", group: "Dollar", unit: "", note: "Dollar against a broad basket, 2006 = 100" },
];
const ALLOWED = new Map<string, string | undefined>([...Object.keys(FRED_SERIES), ...INTL_BONDS.map((b) => b[0])].map((i) => [i, undefined] as [string, string | undefined]).concat(MACRO.map((m) => [m.id, m.units] as [string, string | undefined])));

async function fetchSeries(id: string, units?: string): Promise<FredPoint> {
  const key = process.env.FRED_API_KEY;
  if (!key) throw new Error("FRED_API_KEY missing");
  const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${id}&api_key=${key}&file_type=json&sort_order=desc&limit=10${units ? `&units=${units}` : ""}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`FRED ${id} HTTP ${res.status}`);
  const json = (await res.json()) as { observations?: { date: string; value: string }[] };
  const good = (json.observations ?? []).filter((o) => o.value !== "." && isFinite(Number(o.value))); // FRED uses "." for missing days
  const [a, b] = good;
  return { series: id, value: a ? Number(a.value) : null, date: a?.date ?? null, prev: b ? Number(b.value) : null, prevDate: b?.date ?? null };
}

/** Only series listed in this file can be requested. Slow series (monthly, quarterly) are cached longer. */
export const getFred = (id: string, ttlSeconds = 60 * 60): Promise<Cached<FredPoint>> => {
  if (!ALLOWED.has(id)) return Promise.reject(new Error(`FRED ${id}: not a listed series`));
  return getOrFetch(`fred:${id}`, ttlSeconds, () => fetchSeries(id, ALLOWED.get(id)));
};

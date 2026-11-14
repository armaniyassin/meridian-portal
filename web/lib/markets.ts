import "server-only";
import { getFred, FRED_SERIES, type FredPoint } from "@/lib/fred";
import { getQuote, type Quote } from "@/lib/fmp";
import type { Cached } from "@/lib/cache";

/** [FMP symbol, label, region]. DAX and CAC 40 return HTTP 402 on the free FMP plan and are shown as unavailable. */
export const INDICES: [string, string, string][] = [
  ["^GSPC", "S&P 500", "Americas"], ["^IXIC", "Nasdaq Composite", "Americas"], ["^DJI", "Dow Jones", "Americas"],
  ["^FTSE", "FTSE 100", "Europe"], ["^STOXX50E", "Euro Stoxx 50", "Europe"], ["^GDAXI", "DAX", "Europe"], ["^FCHI", "CAC 40", "Europe"],
  ["^N225", "Nikkei 225", "Asia-Pacific"], ["^HSI", "Hang Seng", "Asia-Pacific"],
];
export const FX: [string, string][] = [
  ["EURUSD", "EUR/USD"], ["GBPUSD", "GBP/USD"], ["USDJPY", "USD/JPY"], ["USDCHF", "USD/CHF"],
  ["AUDUSD", "AUD/USD"], ["USDCAD", "USD/CAD"], ["NZDUSD", "NZD/USD"],
];

export type Row<T> =
  | { label: string; symbol: string; group: string; ok: true; item: T; fetchedAt: string; stale: boolean }
  | { label: string; symbol: string; group: string; ok: false; error: string };

async function safe<T>(label: string, symbol: string, group: string, p: Promise<Cached<T>>): Promise<Row<T>> {
  try { const c = await p; return { label, symbol, group, ok: true, item: c.data, fetchedAt: c.fetchedAt, stale: c.stale }; }
  catch (e) { return { label, symbol, group, ok: false, error: e instanceof Error ? e.message : String(e) }; }
}

/** Sequential on purpose: gentle on free-plan rate limits. Failed symbols are reported honestly, never estimated. */
export async function getMarketSnapshot() {
  const yields: Row<FredPoint>[] = [];
  for (const id of Object.keys(FRED_SERIES) as (keyof typeof FRED_SERIES)[])
    yields.push(await safe(FRED_SERIES[id], id, id === "VIXCLS" ? "Volatility" : "US Treasuries", getFred(id)));
  const indices: Row<Quote>[] = [];
  for (const [sym, label, region] of INDICES) indices.push(await safe(label, sym, region, getQuote(sym)));
  const fx: Row<Quote>[] = [];
  for (const [sym, label] of FX) fx.push(await safe(label, sym, sym.endsWith("USD") ? "Majors (USD quote)" : "USD against others", getQuote(sym)));
  return { yields, indices, fx, generatedAt: new Date().toISOString() };
}

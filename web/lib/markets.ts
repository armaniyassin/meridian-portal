import "server-only";
import { getFred, FRED_SERIES, type FredPoint } from "@/lib/fred";
import { getQuote, type Quote } from "@/lib/fmp";
import type { Cached } from "@/lib/cache";

export const INDICES: [string, string][] = [
  ["^GSPC", "S&P 500"], ["^IXIC", "Nasdaq Composite"], ["^DJI", "Dow Jones"], ["^FTSE", "FTSE 100"],
  ["^N225", "Nikkei 225"], ["^HSI", "Hang Seng"], ["^STOXX50E", "Euro Stoxx 50"], ["^GDAXI", "DAX"], ["^FCHI", "CAC 40"],
];
export const FX: [string, string][] = [
  ["EURUSD", "EUR/USD"], ["GBPUSD", "GBP/USD"], ["USDJPY", "USD/JPY"], ["USDCHF", "USD/CHF"],
  ["AUDUSD", "AUD/USD"], ["USDCAD", "USD/CAD"], ["NZDUSD", "NZD/USD"],
];

export type Row<T> = { label: string; ok: true; item: T; fetchedAt: string; stale: boolean } | { label: string; ok: false; error: string };

async function safe<T>(label: string, p: Promise<Cached<T>>): Promise<Row<T>> {
  try { const c = await p; return { label, ok: true, item: c.data, fetchedAt: c.fetchedAt, stale: c.stale }; }
  catch (e) { return { label, ok: false, error: e instanceof Error ? e.message : String(e) }; }
}

/** Sequential on purpose: keeps us gentle on the free-plan rate limits. Failed symbols are reported honestly. */
export async function getMarketSnapshot() {
  const yields: Row<FredPoint>[] = [];
  for (const id of Object.keys(FRED_SERIES) as (keyof typeof FRED_SERIES)[]) yields.push(await safe(FRED_SERIES[id], getFred(id)));
  const indices: Row<Quote>[] = [];
  for (const [sym, label] of INDICES) indices.push(await safe(label, getQuote(sym)));
  const fx: Row<Quote>[] = [];
  for (const [sym, label] of FX) fx.push(await safe(label, getQuote(sym)));
  return { yields, indices, fx, generatedAt: new Date().toISOString() };
}

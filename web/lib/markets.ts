import "server-only";
import { getFred, FRED_SERIES, type FredPoint } from "@/lib/fred";
import { getQuote, type Quote } from "@/lib/fmp";
import { getStockQuote } from "@/lib/finnhub";
import type { Cached } from "@/lib/cache";

/** [FMP symbol, label, region]. DAX and CAC 40 return HTTP 402 on the free FMP plan and are shown as unavailable. */
export const INDICES: [string, string, string][] = [
  ["^GSPC", "S&P 500", "Americas"], ["^IXIC", "Nasdaq Composite", "Americas"], ["^DJI", "Dow Jones", "Americas"],
  ["^FTSE", "FTSE 100", "Europe"], ["^STOXX50E", "Euro Stoxx 50", "Europe"], ["^GDAXI", "DAX", "Europe"], ["^FCHI", "CAC 40", "Europe"],
  ["^N225", "Nikkei 225", "Asia-Pacific"], ["^HSI", "Hang Seng", "Asia-Pacific"],
  // Africa: symbols are best guesses for FMP. If the free plan does not return one, it shows as unavailable (and is cached as a failure).
  ["^J200.JO", "JSE Top 40", "Africa"], ["^CASE30", "EGX 30", "Africa"], ["^NGSEINDX", "NGX All-Share", "Africa"], ["^NSE20", "NSE 20", "Africa"],
];
export const FX: [string, string][] = [
  ["EURUSD", "EUR/USD"], ["GBPUSD", "GBP/USD"], ["USDJPY", "USD/JPY"], ["USDCHF", "USD/CHF"],
  ["AUDUSD", "AUD/USD"], ["USDCAD", "USD/CAD"], ["NZDUSD", "NZD/USD"],
  ["USDZAR", "USD/ZAR"], ["USDEGP", "USD/EGP"], ["USDNGN", "USD/NGN"], ["USDKES", "USD/KES"],
];
/** Commodity quotes: [FMP symbol, label, group]. */
export const COMMODITIES: [string, string, string][] = [
  ["GCUSD", "Gold", "Metals"], ["SIUSD", "Silver", "Metals"], ["PLUSD", "Platinum", "Metals"], ["HGUSD", "Copper", "Metals"],
  ["CLUSD", "Crude oil (WTI)", "Energy"], ["BZUSD", "Brent crude", "Energy"], ["NGUSD", "Natural gas", "Energy"],
];

/** Stocks shown on Markets: [ticker, sector]. Quotes come from Finnhub. */
export const STOCKS: [string, string][] = [
  ["AAPL", "Technology"], ["MSFT", "Technology"], ["NVDA", "Technology"], ["AMZN", "Consumer Discretionary"],
  ["TSLA", "Consumer Discretionary"], ["JPM", "Financials"], ["XOM", "Energy"], ["JNJ", "Health Care"],
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
  const commodities: Row<Quote>[] = [];
  for (const [sym, label, group] of COMMODITIES) commodities.push(await safe(label, sym, group, getQuote(sym)));
  const stocks: Row<Quote>[] = [];
  for (const [sym, sector] of STOCKS) stocks.push(await safe(sym, sym, sector, getStockQuote(sym)));
  return { yields, indices, fx, commodities, stocks, generatedAt: new Date().toISOString() };
}

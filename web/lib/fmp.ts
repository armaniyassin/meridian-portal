import "server-only";
import { getOrFetch, type Cached } from "@/lib/cache";

export type Quote = { symbol: string; price: number | null; changePct: number | null };

/** FMP free plan: one symbol per request to /stable/quote (batch endpoints return 402). ~250 requests/day. */
async function fetchQuote(symbol: string): Promise<Quote> {
  const key = process.env.FMP_API_KEY;
  if (!key) throw new Error("FMP_API_KEY missing");
  const res = await fetch(`https://financialmodelingprep.com/stable/quote?symbol=${encodeURIComponent(symbol)}&apikey=${key}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`FMP ${symbol} HTTP ${res.status}`);
  const arr = (await res.json()) as Record<string, unknown>[];
  const q = Array.isArray(arr) ? arr[0] : undefined;
  if (!q) throw new Error(`FMP ${symbol}: no data returned`);
  const num = (v: unknown) => (typeof v === "number" && isFinite(v) ? v : null);
  return { symbol, price: num(q.price), changePct: num(q.changePercentage ?? q.changesPercentage) };
}

export const getQuote = (symbol: string): Promise<Cached<Quote>> =>
  getOrFetch(`fmp:quote:${symbol}`, 3 * 60 * 60, () => fetchQuote(symbol)); // 3h keeps us far below 250/day

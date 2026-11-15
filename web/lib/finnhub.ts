import "server-only";
import { getOrFetch, type Cached } from "@/lib/cache";
import type { Quote } from "@/lib/fmp";

/** Finnhub free plan: US stock quotes, 60 requests a minute, no daily cap. Used for the stock tickers. */
async function fetchStock(symbol: string): Promise<Quote> {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) throw new Error("FINNHUB_API_KEY missing");
  const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${key}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Finnhub ${symbol} HTTP ${res.status}`);
  const j = (await res.json()) as { c?: number; dp?: number | null };
  if (!j || typeof j.c !== "number" || j.c === 0) throw new Error(`Finnhub ${symbol}: no data returned`);
  return { symbol, price: j.c, changePct: typeof j.dp === "number" && isFinite(j.dp) ? j.dp : null };
}

export const getStockQuote = (symbol: string): Promise<Cached<Quote>> =>
  getOrFetch(`finnhub:quote:${symbol}`, 10 * 60, () => fetchStock(symbol));

import "server-only";
import { getOrFetch, type Cached } from "@/lib/cache";
import type { Bar, Perf, PeriodKey } from "@/lib/periods";

const num = (v: unknown) => (typeof v === "number" && isFinite(v) ? v : null);
const DAY = 86_400_000;

function fmpKey() {
  const key = process.env.FMP_API_KEY;
  if (!key) throw new Error("FMP_API_KEY missing");
  return key;
}

/** Five years of daily bars from FMP. One request per symbol, cached for 24 hours so it stays far below the free daily limit. */
async function fetchDaily(symbol: string): Promise<Bar[]> {
  const from = new Date(Date.now() - 5 * 365.25 * DAY - 10 * DAY).toISOString().slice(0, 10);
  const res = await fetch(`https://financialmodelingprep.com/stable/historical-price-eod/full?symbol=${encodeURIComponent(symbol)}&from=${from}&apikey=${fmpKey()}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`FMP history ${symbol} HTTP ${res.status}`);
  const arr = (await res.json()) as Record<string, unknown>[];
  if (!Array.isArray(arr) || !arr.length) throw new Error(`FMP history ${symbol}: no data returned`);
  const bars: Bar[] = [];
  for (const r of arr) {
    const t = Date.parse(`${String(r.date)}T00:00:00Z`), c = num(r.close);
    if (isNaN(t) || c == null) continue;
    bars.push([t, num(r.open), num(r.high), num(r.low), c, num(r.volume)]);
  }
  bars.sort((a, b) => a[0] - b[0]);
  if (!bars.length) throw new Error(`FMP history ${symbol}: no usable rows`);
  return bars;
}
export const getDaily = (symbol: string): Promise<Cached<Bar[]>> => getOrFetch(`fmp:eod5y:${symbol}`, 24 * 3600, () => fetchDaily(symbol));

/** Intraday bars. May not be included in the free FMP plan; then this throws HTTP 402 and the UI says so instead of inventing candles. */
async function fetchIntraday(symbol: string, interval: "5min" | "1hour"): Promise<Bar[]> {
  const res = await fetch(`https://financialmodelingprep.com/stable/historical-chart/${interval}?symbol=${encodeURIComponent(symbol)}&apikey=${fmpKey()}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`FMP ${interval} ${symbol} HTTP ${res.status}`);
  const arr = (await res.json()) as Record<string, unknown>[];
  if (!Array.isArray(arr) || !arr.length) throw new Error(`FMP ${interval} ${symbol}: no data returned`);
  const bars: Bar[] = [];
  for (const r of arr) {
    const t = Date.parse(String(r.date).replace(" ", "T") + "Z"), c = num(r.close); // exchange-local clock, shown as given
    if (isNaN(t) || c == null) continue;
    bars.push([t, num(r.open), num(r.high), num(r.low), c, num(r.volume)]);
  }
  bars.sort((a, b) => a[0] - b[0]);
  return bars;
}
export const getIntraday = (symbol: string, interval: "5min" | "1hour"): Promise<Cached<Bar[]>> =>
  getOrFetch(`fmp:${interval}:${symbol}`, 15 * 60, () => fetchIntraday(symbol, interval));

/** Daily yields from FRED (close only). */
async function fetchFredHistory(id: string): Promise<Bar[]> {
  const key = process.env.FRED_API_KEY;
  if (!key) throw new Error("FRED_API_KEY missing");
  const start = new Date(Date.now() - 5 * 365.25 * DAY - 10 * DAY).toISOString().slice(0, 10);
  const res = await fetch(`https://api.stlouisfed.org/fred/series/observations?series_id=${id}&api_key=${key}&file_type=json&observation_start=${start}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`FRED ${id} HTTP ${res.status}`);
  const json = (await res.json()) as { observations?: { date: string; value: string }[] };
  const bars: Bar[] = [];
  for (const o of json.observations ?? []) { const v = Number(o.value); if (o.value !== "." && isFinite(v)) bars.push([Date.parse(`${o.date}T00:00:00Z`), null, null, null, v, null]); }
  if (!bars.length) throw new Error(`FRED ${id}: no data returned`);
  return bars;
}
export const getFredHistory = (id: string): Promise<Cached<Bar[]>> => getOrFetch(`fred:hist5y:${id}`, 24 * 3600, () => fetchFredHistory(id));

/** Bars for one chart period. Daily periods are slices of the cached 5-year history; 1D and 1W need intraday data. */
export async function barsFor(symbol: string, period: PeriodKey, source: "fmp" | "fred"): Promise<Bar[]> {
  if (source === "fred") return slice((await getFredHistory(symbol)).data, period);
  if (period === "1D") {
    const all = (await getIntraday(symbol, "5min")).data;
    const day = new Date(all[all.length - 1][0]).toISOString().slice(0, 10);
    return all.filter((b) => new Date(b[0]).toISOString().slice(0, 10) === day);
  }
  if (period === "1W") {
    const all = (await getIntraday(symbol, "1hour")).data, last = all[all.length - 1][0];
    return all.filter((b) => b[0] >= last - 7 * DAY);
  }
  return slice((await getDaily(symbol)).data, period);
}
function slice(daily: Bar[], period: PeriodKey): Bar[] {
  const last = daily[daily.length - 1][0];
  const days = { "1D": 1, "1W": 7, "1M": 31, "1Y": 366, "5Y": 99999 }[period];
  return daily.filter((b) => b[0] >= last - days * DAY);
}

/** Percent change for each period, worked out from the daily history: last close against the close on or before the start date. */
export function perfFrom(daily: Bar[]): Perf {
  const last = daily[daily.length - 1], d = new Date(last[0]);
  const back = (y: number, m: number) => { const x = new Date(d); x.setUTCFullYear(x.getUTCFullYear() - y); x.setUTCMonth(x.getUTCMonth() - m); return x.getTime(); };
  const ref = (cut: number) => { let r: Bar | null = null; for (const b of daily) { if (b[0] <= cut) r = b; else break; } return r; };
  const pct = (r: Bar | null) => (r && r[4] ? (last[4] / r[4] - 1) * 100 : null);
  return {
    "1W": pct(ref(last[0] - 7 * DAY)), "1M": pct(ref(back(0, 1))), "1Y": pct(ref(back(1, 0))),
    "5Y": daily[0][0] <= back(5, 0) + 14 * DAY ? pct(daily[0]) : null,
  };
}

/** Change of a yield, in basis points, over 1D (previous observation), 1W, 1M, 1Y and 5Y. FRED yields are close-only daily values. */
export function bpFrom(daily: Bar[]): Perf {
  const last = daily[daily.length - 1], out: Perf = {};
  const ref = (cut: number) => { let r: Bar | null = null; for (const b of daily) { if (b[0] <= cut) r = b; else break; } return r; };
  const prev = daily.length > 1 ? daily[daily.length - 2] : null;
  out["1D"] = prev ? (last[4] - prev[4]) * 100 : null;
  for (const [k, days] of [["1W", 7], ["1M", 30], ["1Y", 365], ["5Y", 1826]] as const) {
    const r = ref(last[0] - days * DAY);
    out[k] = r && (days < 1826 || daily[0][0] <= last[0] - days * DAY + 14 * DAY) ? (last[4] - r[4]) * 100 : null;
  }
  return out;
}

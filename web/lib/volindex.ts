import "server-only";
import { getOrFetch, type Cached } from "@/lib/cache";
import type { FredPoint } from "@/lib/fred";

/** Two volatility gauges that are not on FRED. Both are read once an hour at most (cached), and a failure just leaves the row out. */

/** CBOE SKEW: the exchange's own public daily CSV (date, value). */
async function fetchSkew(): Promise<FredPoint> {
  const res = await fetch("https://cdn.cboe.com/api/global/us_indices/daily_prices/SKEW_History.csv", { cache: "no-store", headers: { "User-Agent": "MeridianPortal/1.0" } });
  if (!res.ok) throw new Error(`CBOE SKEW HTTP ${res.status}`);
  const rows: { date: string; v: number }[] = [];
  for (const line of (await res.text()).split(/\r?\n/)) {
    const [d, v] = line.split(",");
    const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec((d ?? "").trim()), n = Number(v);
    if (m && isFinite(n)) rows.push({ date: `${m[3]}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`, v: n });
    else if (/^\d{4}-\d{2}-\d{2}$/.test((d ?? "").trim()) && isFinite(n)) rows.push({ date: d.trim(), v: n });
  }
  rows.sort((a, b) => (a.date < b.date ? -1 : 1));
  const a = rows[rows.length - 1], b = rows[rows.length - 2];
  if (!a) throw new Error("CBOE SKEW: no rows parsed");
  return { series: "SKEW", value: a.v, date: a.date, prev: b?.v ?? null, prevDate: b?.date ?? null };
}
export const getSkew = (): Promise<Cached<FredPoint>> => getOrFetch("vol:skew", 60 * 60, fetchSkew);

/** ICE BofA MOVE: there is no free official feed. This reads Yahoo Finance's public chart endpoint, which is unofficial and not licensed for
 *  commercial redistribution. Set MOVE_SOURCE=off to switch it off (the row then disappears) until a licensed source is bought. */
async function fetchMove(): Promise<FredPoint> {
  if (process.env.MOVE_SOURCE === "off") throw new Error("MOVE source switched off (HTTP 403)");
  const res = await fetch("https://query1.finance.yahoo.com/v8/finance/chart/%5EMOVE?range=10d&interval=1d", { cache: "no-store", headers: { "User-Agent": "Mozilla/5.0 (compatible; MeridianPortal/1.0)" } });
  if (!res.ok) throw new Error(`MOVE HTTP ${res.status}`);
  const j = (await res.json()) as { chart?: { result?: { timestamp?: number[]; indicators?: { quote?: { close?: (number | null)[] }[] } }[] } };
  const r = j.chart?.result?.[0], ts = r?.timestamp ?? [], cl = r?.indicators?.quote?.[0]?.close ?? [];
  const pts = ts.map((t, i) => ({ date: new Date(t * 1000).toISOString().slice(0, 10), v: cl[i] })).filter((p): p is { date: string; v: number } => typeof p.v === "number" && isFinite(p.v));
  const a = pts[pts.length - 1], b = pts[pts.length - 2];
  if (!a) throw new Error("MOVE: no data returned");
  return { series: "MOVE", value: a.v, date: a.date, prev: b?.v ?? null, prevDate: b?.date ?? null };
}
export const getMove = (): Promise<Cached<FredPoint>> => getOrFetch("vol:move", 60 * 60, fetchMove);

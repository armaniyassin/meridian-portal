import "server-only";
import { getOrFetch, type Cached } from "@/lib/cache";

export type FredPoint = { series: string; value: number | null; date: string | null };
export const FRED_SERIES = { DGS2: "US 2-year Treasury", DGS10: "US 10-year Treasury", VIXCLS: "VIX" } as const;

async function fetchSeries(id: string): Promise<FredPoint> {
  const key = process.env.FRED_API_KEY;
  if (!key) throw new Error("FRED_API_KEY missing");
  const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${id}&api_key=${key}&file_type=json&sort_order=desc&limit=10`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`FRED ${id} HTTP ${res.status}`);
  const json = (await res.json()) as { observations?: { date: string; value: string }[] };
  const obs = (json.observations ?? []).find((o) => o.value !== "."); // FRED uses "." for missing days
  return { series: id, value: obs ? Number(obs.value) : null, date: obs?.date ?? null };
}

export const getFred = (id: keyof typeof FRED_SERIES): Promise<Cached<FredPoint>> =>
  getOrFetch(`fred:${id}`, 60 * 60, () => fetchSeries(id)); // 1h

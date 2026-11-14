import type { Row } from "@/lib/markets";
import type { FredPoint } from "@/lib/fred";
import type { Quote } from "@/lib/fmp";

/** Plain, serialisable shapes handed to the client tabs. */
export type Item = {
  label: string; group: string;
  value: number | null;      // yield in % or daily change in %
  price?: number | null;     // quote level
  date?: string | null;      // FRED observation date
  saved?: boolean;           // last saved value, provider did not answer
  reason?: string;           // set when unavailable
};
export type Strength = { code: string; name: string; chg: number | null; saved: boolean };
export type MarketsData = {
  generatedAt: string; yields: Item[]; vix: Item | null; indices: Item[]; fx: Item[]; strength: Strength[];
};

/** Plain-language reason for a failed row. */
export function friendly(error: string) {
  if (/HTTP 40[23]/.test(error)) return "Not covered by our data plan";
  if (/missing/i.test(error)) return "Data connection not set up";
  return "Unavailable right now";
}

const quoteItem = (r: Row<Quote>): Item =>
  r.ok ? { label: r.label, group: r.group, value: r.item.changePct, price: r.item.price, saved: r.stale }
       : { label: r.label, group: r.group, value: null, reason: friendly(r.error) };

const CCY: [string, string, string][] = [
  ["EUR", "Euro", "EURUSD"], ["JPY", "Japanese yen", "USDJPY"], ["GBP", "British pound", "GBPUSD"], ["CHF", "Swiss franc", "USDCHF"],
  ["CAD", "Canadian dollar", "USDCAD"], ["AUD", "Australian dollar", "AUDUSD"], ["NZD", "New Zealand dollar", "NZDUSD"],
];

export function buildView(s: { yields: Row<FredPoint>[]; indices: Row<Quote>[]; fx: Row<Quote>[]; generatedAt: string }): MarketsData {
  const fredItem = (r: Row<FredPoint>): Item =>
    r.ok ? { label: r.label, group: r.group, value: r.item.value, date: r.item.date, saved: r.stale }
         : { label: r.label, group: r.group, value: null, reason: friendly(r.error) };
  const yields = s.yields.filter((r) => r.symbol !== "VIXCLS").map(fredItem);
  const vixRow = s.yields.find((r) => r.symbol === "VIXCLS");
  // Strength vs USD is derived from the FX quotes: XXX/USD pairs move with the currency, USD/XXX pairs move against it.
  const strength: Strength[] = CCY.map(([code, name, sym]) => {
    const r = s.fx.find((x) => x.symbol === sym);
    if (!r || !r.ok || r.item.changePct == null) return { code, name, chg: null, saved: false };
    const p = r.item.changePct;
    return { code, name, chg: sym.startsWith("USD") ? (100 / (100 + p) - 1) * 100 : p, saved: r.stale };
  });
  return { generatedAt: s.generatedAt, yields, vix: vixRow ? fredItem(vixRow) : null, indices: s.indices.map(quoteItem), fx: s.fx.map(quoteItem), strength };
}

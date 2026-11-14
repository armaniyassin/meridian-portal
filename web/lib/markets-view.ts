import type { Row } from "@/lib/markets";
import type { FredPoint } from "@/lib/fred";
import type { Quote } from "@/lib/fmp";
import { REGIONS } from "@/lib/hubs";

/** Plain, serialisable shapes handed to the client tabs. */
export type Item = {
  label: string; group: string;
  value: number | null;      // yield in % or daily change in %
  price?: number | null;     // quote level
  date?: string | null;      // FRED observation date
  saved?: boolean;           // last saved value, provider did not answer
  reason?: string;           // set when there is no value
};
export type Strength = { code: string; name: string; chg: number | null; saved: boolean };
export type MarketsData = {
  generatedAt: string; yields: Item[]; vix: Item | null; indices: Item[]; fx: Item[]; commodities: Item[]; stocks: Item[]; strength: Strength[];
};

/** Plain-language reason for a failed row. Rows without data are hidden in the UI, so this is only used for diagnostics. */
export function friendly(error: string) {
  if (/HTTP 40[23]/.test(error)) return "Not covered by our data plan";
  if (/missing/i.test(error)) return "Data connection not set up";
  return "Unavailable right now";
}

const quoteItem = (r: Row<Quote>): Item =>
  r.ok ? { label: r.label, group: r.group, value: r.item.changePct, price: r.item.price, saved: r.stale }
       : { label: r.label, group: r.group, value: null, reason: friendly(r.error) };

const fredItem = (r: Row<FredPoint>): Item =>
  r.ok ? { label: r.label, group: r.group, value: r.item.value, date: r.item.date, saved: r.stale }
       : { label: r.label, group: r.group, value: null, reason: friendly(r.error) };

// Currencies against the US dollar. A tile appears only when its pair has a live quote.
const CCY: [string, string, string | null][] = [
  ["EUR", "Euro", "EURUSD"], ["JPY", "Japanese yen", "USDJPY"], ["GBP", "British pound", "GBPUSD"], ["CHF", "Swiss franc", "USDCHF"],
  ["CAD", "Canadian dollar", "USDCAD"], ["AUD", "Australian dollar", "AUDUSD"], ["NZD", "New Zealand dollar", "NZDUSD"], ["CNY", "Chinese yuan", null],
  ["ZAR", "South African rand", "USDZAR"], ["EGP", "Egyptian pound", "USDEGP"], ["NGN", "Nigerian naira", "USDNGN"], ["KES", "Kenyan shilling", "USDKES"],
];

/** Only instruments with a real value are shown. Anything the plan does not cover, or that failed, is left out instead of showing an empty row. */
const has = (i: Item) => i.value != null;

export function buildView(s: { yields: Row<FredPoint>[]; indices: Row<Quote>[]; fx: Row<Quote>[]; commodities: Row<Quote>[]; stocks: Row<Quote>[]; generatedAt: string }): MarketsData {
  const us = s.yields.filter((r) => r.symbol !== "VIXCLS").map(fredItem).filter(has);
  const vixRow = s.yields.find((r) => r.symbol === "VIXCLS");
  const vix = vixRow ? fredItem(vixRow) : null;

  const regionOrder: string[] = [...REGIONS];
  const indices = s.indices.map(quoteItem).filter(has).sort((a, b) => regionOrder.indexOf(a.group) - regionOrder.indexOf(b.group));
  const fx = s.fx.map(quoteItem).filter(has).sort((a, b) => (a.group < b.group ? -1 : a.group > b.group ? 1 : 0));
  const commodities = s.commodities.map(quoteItem).filter(has);
  const stocks = s.stocks.map(quoteItem).filter(has);

  // Strength vs USD is worked out from the FX quotes: XXX/USD pairs move with the currency, USD/XXX pairs move against it.
  const strength: Strength[] = CCY.flatMap(([code, name, sym]) => {
    const r = sym ? s.fx.find((x) => x.symbol === sym) : undefined;
    if (!r || !r.ok || r.item.changePct == null) return [];
    const p = r.item.changePct;
    return [{ code, name, chg: sym!.startsWith("USD") ? (100 / (100 + p) - 1) * 100 : p, saved: r.stale }];
  });

  return { generatedAt: s.generatedAt, yields: us, vix: vix && has(vix) ? vix : null, indices, fx, commodities, stocks, strength };
}

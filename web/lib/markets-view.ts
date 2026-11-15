import type { Row } from "@/lib/markets";
import type { FredPoint } from "@/lib/fred";
import type { Quote } from "@/lib/fmp";
import { REGIONS } from "@/lib/hubs";
import { MACRO } from "@/lib/fred";
import { findIndicator, findInstrument } from "@/lib/seo-catalog";

/** Plain, serialisable shapes handed to the client tabs. */
export type Item = {
  label: string; group: string;
  symbol?: string;           // data-provider symbol, used to open the chart
  value: number | null;      // yield in % or daily change in %
  price?: number | null;     // quote level
  date?: string | null;      // FRED observation date
  saved?: boolean;           // last saved value, provider did not answer
  reason?: string;           // set when there is no value
  href?: string;             // own page (/markets/NVDA, /indicators/us-cpi); set on the server, so the client stays free of server-only code
};
/** A macro indicator: latest value, the one before it, and how it is written. */
export type Macro = { id: string; label: string; group: string; value: number | null; prev: number | null; date: string | null; unit: string; note: string; home: boolean };
export type Strength = { code: string; name: string; chg: number | null; saved: boolean; pair: string; inv: boolean };
export type MarketsData = {
  generatedAt: string; yields: Item[]; vix: Item | null; indices: Item[]; fx: Item[]; commodities: Item[]; stocks: Item[]; strength: Strength[]; macro: Macro[];
};

/** Plain-language reason for a failed row. Rows without data are hidden in the UI, so this is only used for diagnostics. */
export function friendly(error: string) {
  if (/HTTP 40[23]/.test(error)) return "Not covered by our data plan";
  if (/missing/i.test(error)) return "Data connection not set up";
  return "Unavailable right now";
}

const quoteItem = (r: Row<Quote>): Item =>
  r.ok ? { label: r.label, symbol: r.symbol, group: r.group, value: r.item.changePct, price: r.item.price, saved: r.stale }
       : { label: r.label, group: r.group, value: null, reason: friendly(r.error) };

const fredItem = (r: Row<FredPoint>): Item =>
  r.ok ? { label: r.label, symbol: r.symbol, group: r.group, value: r.item.value, date: r.item.date, saved: r.stale }
       : { label: r.label, group: r.group, value: null, reason: friendly(r.error) };

// Currencies against the US dollar. A tile appears only when its pair has a live quote.
const CCY: [string, string, string | null][] = [
  ["EUR", "Euro", "EURUSD"], ["JPY", "Japanese yen", "USDJPY"], ["GBP", "British pound", "GBPUSD"], ["CHF", "Swiss franc", "USDCHF"],
  ["CAD", "Canadian dollar", "USDCAD"], ["AUD", "Australian dollar", "AUDUSD"], ["NZD", "New Zealand dollar", "NZDUSD"], ["CNY", "Chinese yuan", null],
  ["ZAR", "South African rand", "USDZAR"], ["EGP", "Egyptian pound", "USDEGP"], ["NGN", "Nigerian naira", "USDNGN"], ["KES", "Kenyan shilling", "USDKES"],
];

/** Only instruments with a real value are shown. Anything the plan does not cover, or that failed, is left out instead of showing an empty row. */
const has = (i: Item) => i.value != null;
/** Where a click on this row should go: the instrument's own indexable page, or the indicator page for a FRED series. */
const link = (i: Item, bond = false): Item => {
  if (!i.symbol) return i;
  const inst = findInstrument(i.symbol.replace(/^\^/, ""));
  if (inst && inst.indexable) return { ...i, href: `/markets/${inst.slug}` };
  const ind = bond ? findIndicator(i.symbol) : undefined;
  return ind ? { ...i, href: `/indicators/${ind.slug}` } : i;
};

export function buildView(s: { yields: Row<FredPoint>[]; intl?: Row<FredPoint>[]; macro?: Row<FredPoint>[]; extraQuotes?: Row<FredPoint>[]; indices: Row<Quote>[]; fx: Row<Quote>[]; commodities: Row<Quote>[]; stocks: Row<Quote>[]; generatedAt: string }): MarketsData {
  const us = s.yields.filter((r) => r.symbol !== "VIXCLS").map(fredItem).filter(has).map((i) => link(i, true));
  // other countries: monthly OECD series, shown with their month, not clickable (no daily history to chart)
  const other = (s.intl ?? []).map(fredItem).filter(has).map((i) => ({ ...i, symbol: undefined }));
  us.push(...other);
  const vixRow = s.yields.find((r) => r.symbol === "VIXCLS");
  const vix = vixRow ? fredItem(vixRow) : null;

  const regionOrder: string[] = [...REGIONS];
  const indices = s.indices.map(quoteItem).filter(has).map((i) => link(i)).sort((a, b) => regionOrder.indexOf(a.group) - regionOrder.indexOf(b.group));
  const fx = s.fx.map(quoteItem).filter(has).map((i) => link(i)).sort((a, b) => (a.group < b.group ? -1 : a.group > b.group ? 1 : 0));
  const commodities = s.commodities.map(quoteItem).filter(has).map((i) => link(i));
  const stocks = s.stocks.map(quoteItem).filter(has).map((i) => link(i));

  // Strength vs USD is worked out from the FX quotes: XXX/USD pairs move with the currency, USD/XXX pairs move against it.
  const strength: Strength[] = CCY.flatMap(([code, name, sym]) => {
    const r = sym ? s.fx.find((x) => x.symbol === sym) : undefined;
    if (!r || !r.ok || r.item.changePct == null) return [];
    const p = r.item.changePct;
    const inv = sym!.startsWith("USD");
    return [{ code, name, chg: inv ? (100 / (100 + p) - 1) * 100 : p, saved: r.stale, pair: `${sym!.slice(0, 3)}/${sym!.slice(3)}`, inv }];
  });

  const macro: Macro[] = [
    ...(s.macro ?? []).flatMap((r) => { const d = MACRO.find((m) => m.id === r.symbol); return r.ok && d && r.item.value != null ? [{ id: d.id, label: d.label, group: d.group, value: r.item.value, prev: r.item.prev ?? null, date: r.item.date, unit: d.unit, note: d.note, home: !!d.home }] : []; }),
    ...(s.extraQuotes ?? []).flatMap((r) => (r.ok && r.item.value != null ? [{ id: r.symbol, label: r.label, group: r.group, value: r.item.value, prev: r.item.prev ?? null, date: r.item.date, unit: "", note: r.symbol === "MOVE" ? "Expected volatility of US Treasury yields (ICE BofA MOVE)" : "How much the market pays for tail-risk protection (CBOE SKEW)", home: r.symbol === "MOVE" }] : [])),
  ];
  return { generatedAt: s.generatedAt, macro, yields: us, vix: vix && has(vix) ? vix : null, indices, fx, commodities, stocks, strength };
}

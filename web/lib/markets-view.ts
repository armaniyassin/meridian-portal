import type { Row } from "@/lib/markets";
import type { FredPoint } from "@/lib/fred";
import type { Quote } from "@/lib/fmp";
import { HUBS, REGIONS, regionOf } from "@/lib/hubs";

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
  generatedAt: string; yields: Item[]; vix: Item | null; indices: Item[]; fx: Item[]; commodities: Item[]; strength: Strength[];
};

const AWAITING = "Awaiting feed";

/** Plain-language reason for a failed row. */
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

// Currencies against the US dollar. DXY comes first and has no source yet; CNY is not on the FMP plan we use.
const CCY: [string, string, string | null][] = [
  ["EUR", "Euro", "EURUSD"], ["JPY", "Japanese yen", "USDJPY"], ["GBP", "British pound", "GBPUSD"], ["CHF", "Swiss franc", "USDCHF"],
  ["CAD", "Canadian dollar", "USDCAD"], ["AUD", "Australian dollar", "AUDUSD"], ["NZD", "New Zealand dollar", "NZDUSD"], ["CNY", "Chinese yuan", null],
  ["ZAR", "South African rand", "USDZAR"], ["EGP", "Egyptian pound", "USDEGP"], ["NGN", "Nigerian naira", "USDNGN"], ["KES", "Kenyan shilling", "USDKES"],
];

export function buildView(s: { yields: Row<FredPoint>[]; indices: Row<Quote>[]; fx: Row<Quote>[]; commodities: Row<Quote>[]; generatedAt: string }): MarketsData {
  // Bonds: US Treasuries are live; the other countries are listed so the page matches the design, and read "Awaiting feed".
  const us = s.yields.filter((r) => r.symbol !== "VIXCLS").map(fredItem);
  const otherBonds: Item[] = HUBS.filter((h) => h.bsrc && h.id !== "nyc").map((h) => ({
    label: h.bond.replace(" 10-year", " 10y").replace("Germany 10y Bund", "Germany 10y").replace("UK 10y gilt", "UK 10y"),
    group: regionOf(h), value: null, reason: AWAITING,
  }));
  const vixRow = s.yields.find((r) => r.symbol === "VIXCLS");

  // Indices: everything fetched, plus the hub indices we do not fetch yet (kept off FMP's 250 requests a day).
  const fetched = s.indices.map(quoteItem);
  const have = new Set(fetched.map((i) => i.label));
  const pending: Item[] = HUBS.filter((h) => !have.has(h.idx)).map((h) => ({ label: h.idx, group: regionOf(h), value: null, reason: AWAITING }));
  const regionOrder: string[] = [...REGIONS];
  const indices = [...fetched, ...pending].sort((a, b) => regionOrder.indexOf(a.group) - regionOrder.indexOf(b.group));

  const fxHave = new Set(s.fx.map((r) => r.label));
  const fxPending: Item[] = [...new Set(HUBS.map((h) => h.fx))].filter((p) => !fxHave.has(p))
    .map((p) => ({ label: p, group: p.endsWith("/USD") ? "Majors (USD quote)" : "USD against others", value: null, reason: AWAITING }));
  const fx = [...s.fx.map(quoteItem), ...fxPending].sort((a, b) => (a.group < b.group ? -1 : a.group > b.group ? 1 : 0));

  // Strength vs USD is worked out from the FX quotes: XXX/USD pairs move with the currency, USD/XXX pairs move against it.
  const strength: Strength[] = [{ code: "DXY", name: "US dollar index", chg: null, saved: false },
    ...CCY.map(([code, name, sym]) => {
      const r = sym ? s.fx.find((x) => x.symbol === sym) : undefined;
      if (!r || !r.ok || r.item.changePct == null) return { code, name, chg: null, saved: false };
      const p = r.item.changePct;
      return { code, name, chg: sym!.startsWith("USD") ? (100 / (100 + p) - 1) * 100 : p, saved: r.stale };
    })];

  return { generatedAt: s.generatedAt, yields: [...us, ...otherBonds], vix: vixRow ? fredItem(vixRow) : null, indices, fx, commodities: s.commodities.map(quoteItem), strength };
}

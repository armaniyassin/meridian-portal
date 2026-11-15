import { COMMODITIES, FX, INDICES, STOCKS } from "@/lib/markets";
import { FRED_SERIES, INTL_BONDS, MACRO } from "@/lib/fred";

/** Every symbol and indicator that gets its own indexable URL. Built only from the lists the app already fetches, so no page can exist without a data source. */
export type InstKind = "stock" | "index" | "currency" | "commodity";
export type Inst = { slug: string; symbol: string; label: string; kind: InstKind; group: string; sub: string; indexable: boolean };
export const KIND_LABEL: Record<InstKind, string> = { stock: "Stock", index: "Index", currency: "Currency pair", commodity: "Commodity" };
export const KIND_GROUP: Record<InstKind, string> = { stock: "stocks", index: "indices", currency: "currencies", commodity: "commodities" };

const slugOf = (symbol: string) => symbol.replace(/^\^/, "").toUpperCase();

export const INSTRUMENTS: Inst[] = [
  ...STOCKS.map(([t, sector]): Inst => ({ slug: slugOf(t), symbol: t, label: t, kind: "stock", group: "Stocks", sub: sector, indexable: true })),
  // Africa symbols are best guesses on the FMP free plan: the page exists but is noindex until it has data.
  ...INDICES.map(([s, l, region]): Inst => ({ slug: slugOf(s), symbol: s, label: l, kind: "index", group: "Indices", sub: region, indexable: region !== "Africa" })),
  ...FX.map(([s, l], i): Inst => ({ slug: slugOf(s), symbol: s, label: l, kind: "currency", group: "Currencies", sub: i < 7 ? "Major pair" : "Emerging-market pair", indexable: i < 7 })),
  ...COMMODITIES.map(([s, l, g]): Inst => ({ slug: slugOf(s), symbol: s, label: l, kind: "commodity", group: "Commodities", sub: g, indexable: true })),
];
export const findInstrument = (slug: string) => INSTRUMENTS.find((i) => i.slug === slug.toUpperCase());

export type Indicator = { slug: string; id: string; label: string; group: string; unit: string; note: string; ttl: number };
const DAY = 24 * 3600;
/** Readable URLs for search intent (/indicators/us-cpi). The raw FRED id (e.g. /indicators/cpiaucsl) still works and redirects here. */
const SLUGS: Record<string, string> = {
  VIXCLS: "vix", BAMLH0A0HYM2: "high-yield-credit-spread", STLFSI4: "financial-stress-index", NFCI: "financial-conditions-index",
  T10Y2Y: "yield-curve-10y-2y", T10Y3M: "yield-curve-10y-3m", DFF: "fed-funds-rate", T5YIE: "breakeven-inflation-5y",
  CPIAUCSL: "us-cpi", PCEPI: "us-pce-inflation", A191RL1Q225SBEA: "us-gdp-growth", UNRATE: "us-unemployment-rate",
  ICSA: "us-jobless-claims", UMCSENT: "us-consumer-sentiment", DTWEXBGS: "us-dollar-index", DGS2: "us-2-year-treasury-yield", DGS10: "us-10-year-treasury-yield",
};
const slugify = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const macro: Indicator[] = MACRO.map((m) => ({ slug: SLUGS[m.id] ?? m.id.toLowerCase(), id: m.id, label: m.label, group: m.group, unit: m.unit, note: m.note, ttl: 6 * 3600 }));
const bonds: Indicator[] = INTL_BONDS.map(([id, label, region]) => ({ slug: `${slugify(label)}-yield`, id, label, group: `Government bond yields · ${region}`, unit: "%", note: "OECD monthly average of the 10-year government bond yield, published through FRED.", ttl: DAY }));
const us: Indicator[] = Object.entries(FRED_SERIES).map(([id, label]) => ({ slug: SLUGS[id] ?? id.toLowerCase(), id, label, group: id === "VIXCLS" ? "Volatility and credit" : "Government bond yields · US", unit: id === "VIXCLS" ? "" : "%", note: "Daily series published through FRED.", ttl: 3600 }));
const seen = new Set<string>();
export const INDICATORS: Indicator[] = [...macro, ...us, ...bonds].filter((i) => !seen.has(i.id) && seen.add(i.id));
export const findIndicator = (slug: string) => INDICATORS.find((i) => i.slug === slug.toLowerCase()) ?? INDICATORS.find((i) => i.id.toLowerCase() === slug.toLowerCase());

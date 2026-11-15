import "server-only";
import { INDICES, FX, COMMODITIES, STOCKS } from "@/lib/markets";
import type { Kind } from "@/lib/periods";

export type Instrument = { symbol: string; label: string; kind: Exclude<Kind, "bond"> };
/** Panels that can show period performance. Label matches the row label in the UI. */
export const GROUPS: Record<string, Instrument[]> = {
  indices: INDICES.map(([symbol, label]) => ({ symbol, label, kind: "index" as const })),
  fx: FX.map(([symbol, label]) => ({ symbol, label, kind: "fx" as const })),
  commodities: COMMODITIES.map(([symbol, label]) => ({ symbol, label, kind: "commodity" as const })),
  stocks: STOCKS.map(([symbol]) => ({ symbol, label: symbol, kind: "stock" as const })),
};
/** Only symbols we already list can be requested, so the routes cannot be used to burn the free data quota. */
export const findInstrument = (symbol: string): Instrument | null => Object.values(GROUPS).flat().find((i) => i.symbol === symbol) ?? null;
export const BOND_SERIES = ["DGS2", "DGS10"] as const;

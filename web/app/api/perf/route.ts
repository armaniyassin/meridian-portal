import { NextResponse } from "next/server";
import { GROUPS } from "@/lib/instruments";
import { getDaily, getFredHistory, perfFrom, bpFrom } from "@/lib/history";
import { FRED_SERIES } from "@/lib/fred";
import { BOND_SERIES } from "@/lib/instruments";
import type { Perf } from "@/lib/periods";

export const revalidate = 3600;

/** Period performance (1W, 1M, 1Y, 5Y) for one panel, from cached daily history. Sequential and cached, so the free plan limits are safe. Symbols that fail are left out, never estimated. */
export async function GET(req: Request) {
  const group = new URL(req.url).searchParams.get("group") ?? "";
  if (group === "bonds") {
    // Yield changes are in basis points (1 bp = 0.01 percentage point), from cached FRED history.
    const perf: Record<string, Perf> = {};
    for (const id of BOND_SERIES) { try { perf[FRED_SERIES[id]] = bpFrom((await getFredHistory(id)).data); } catch { /* row shows a dash */ } }
    return NextResponse.json({ perf });
  }
  const list = GROUPS[group];
  if (!list) return NextResponse.json({ error: "unknown group" }, { status: 400 });
  const perf: Record<string, Perf> = {};
  for (const i of list) {
    try { perf[i.label] = perfFrom((await getDaily(i.symbol)).data); } catch { /* not covered or failed: row shows a dash */ }
  }
  return NextResponse.json({ perf });
}

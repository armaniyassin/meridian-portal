import { NextResponse } from "next/server";
import { BOND_SERIES, findInstrument } from "@/lib/instruments";
import { barsFor } from "@/lib/history";
import { PERIODS, type PeriodKey } from "@/lib/periods";

export const revalidate = 300;

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams, symbol = q.get("symbol") ?? "", period = q.get("period") ?? "";
  if (!PERIODS.some(([k]) => k === period)) return NextResponse.json({ error: "bad period" }, { status: 400 });
  const isBond = (BOND_SERIES as readonly string[]).includes(symbol);
  if (!isBond && !findInstrument(symbol)) return NextResponse.json({ error: "unknown symbol" }, { status: 400 });
  try {
    const bars = await barsFor(symbol, period as PeriodKey, isBond ? "fred" : "fmp");
    return NextResponse.json({ bars });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const plan = /HTTP 40[23]/.test(msg);
    return NextResponse.json({ bars: [], note: plan ? "This period is not included in our current data plan." : "No data available for this period right now." });
  }
}

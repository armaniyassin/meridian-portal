import { NextResponse } from "next/server";
import { findInstrument } from "@/lib/instruments";
import { getFundamentals } from "@/lib/fundamentals";

export const revalidate = 3600;

export async function GET(req: Request) {
  const symbol = new URL(req.url).searchParams.get("symbol") ?? "";
  const inst = findInstrument(symbol);
  if (!inst || inst.kind !== "stock") return NextResponse.json({ error: "not a stock" }, { status: 400 });
  try { return NextResponse.json({ fund: (await getFundamentals(symbol)).data }); }
  catch { return NextResponse.json({ fund: null }); }
}

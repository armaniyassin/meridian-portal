import { NextResponse } from "next/server";
import { getMarketSnapshot } from "@/lib/markets";

export const revalidate = 300;

export async function GET() {
  try { return NextResponse.json(await getMarketSnapshot()); }
  catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "failed" }, { status: 500 }); }
}

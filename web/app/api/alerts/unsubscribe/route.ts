import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function off(token: string | null) {
  if (!token || !UUID.test(token)) return false;
  const { error } = await supabaseAdmin().from("alerts").update({ active: false }).eq("unsub_token", token);
  return !error;
}
/** Link in every alert email. Switching an alert off is harmless and idempotent, so a plain GET is fine. */
export async function GET(req: Request) {
  const ok = await off(new URL(req.url).searchParams.get("token"));
  return NextResponse.redirect(new URL(ok ? "/alerts/unsubscribed" : "/alerts/unsubscribed?error=1", req.url), 303);
}
/** RFC 8058 one-click unsubscribe used by mail clients. */
export async function POST(req: Request) { return NextResponse.json({ ok: await off(new URL(req.url).searchParams.get("token")) }); }

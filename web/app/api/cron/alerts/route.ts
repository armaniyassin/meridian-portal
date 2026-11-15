import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { sendAlertEmail } from "@/lib/alerts/email";
import { getQuote } from "@/lib/fmp";
import { getStockQuote } from "@/lib/finnhub";
import { getFred } from "@/lib/fred";
import { findIndicator, findInstrument } from "@/lib/seo-catalog";
import { abs, utc } from "@/lib/site";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
const MAX_EMAILS = 200;

type Row = { id: string; user_id: string; target_type: "ticker" | "indicator"; target_slug: string; condition: "above" | "below" | "changes"; threshold: number | null; last_obs_date: string | null; unsub_token: string };
type Reading = { label: string; value: number | null; date: string; path: string; unit: string };

const authorised = (req: Request) => {
  const secret = process.env.CRON_SECRET;
  if (!secret) return null;
  const got = Buffer.from(req.headers.get("authorization") ?? ""), want = Buffer.from(`Bearer ${secret}`);
  return got.length === want.length && timingSafeEqual(got, want);
};

/** Reads go through the same cached functions the pages use: one lookup per distinct target, never one per alert or per user. */
async function read(type: Row["target_type"], slug: string): Promise<Reading | null> {
  try {
    if (type === "ticker") {
      const i = findInstrument(slug); if (!i) return null;
      const c = await (i.kind === "stock" ? getStockQuote(i.symbol) : getQuote(i.symbol));
      if (c.stale || c.data.price == null) return null;           // never alert on data we know is old
      return { label: i.label, value: c.data.price, date: c.fetchedAt, path: `/markets/${i.slug}`, unit: "" };
    }
    const i = findIndicator(slug); if (!i) return null;
    const c = await getFred(i.id, i.ttl);
    if (c.data.value == null || !c.data.date) return null;
    return { label: i.label, value: c.data.value, date: c.data.date, path: `/indicators/${i.slug}`, unit: i.unit === "%" ? "%" : "" };
  } catch { return null; }
}

export async function GET(req: Request) {
  const ok = authorised(req);
  if (ok === null) return NextResponse.json({ error: "CRON_SECRET not set" }, { status: 503 });
  if (!ok) return NextResponse.json({ error: "unauthorised" }, { status: 401 });

  const db = supabaseAdmin();
  const { data, error } = await db.from("alerts").select("id,user_id,target_type,target_slug,condition,threshold,last_obs_date,unsub_token").eq("active", true).limit(2000);
  if (error) return NextResponse.json({ error: "read failed" }, { status: 500 });
  const rows = (data ?? []) as Row[];

  const readings = new Map<string, Reading | null>();
  for (const r of rows) { const k = `${r.target_type}:${r.target_slug}`; if (!readings.has(k)) readings.set(k, await read(r.target_type, r.target_slug)); }

  let sent = 0, failed = 0, baselined = 0;
  for (const r of rows) {
    if (sent >= MAX_EMAILS) break;
    const rd = readings.get(`${r.target_type}:${r.target_slug}`);
    if (!rd) continue;
    const now = new Date().toISOString();
    let hit = false, what = "";
    if (r.condition === "changes") {
      if (r.last_obs_date == null) { await db.from("alerts").update({ last_obs_date: rd.date }).eq("id", r.id).is("last_obs_date", null); baselined++; continue; }  // first run: remember, don't email
      hit = rd.date !== r.last_obs_date; what = `new data for ${rd.date}: ${rd.value}${rd.unit}`;
    } else if (rd.value != null && r.threshold != null) {
      hit = r.condition === "above" ? rd.value > r.threshold : rd.value < r.threshold;
      what = `${rd.value}${rd.unit} is ${r.condition} ${r.threshold}`;
    }
    if (!hit) continue;

    // Claim the alert first so two overlapping runs cannot both send. One-shot alerts switch off; "new data" alerts stay on with a moved marker.
    const claim = r.condition === "changes"
      ? db.from("alerts").update({ last_obs_date: rd.date, last_triggered_at: now }).eq("id", r.id).eq("active", true).eq("last_obs_date", r.last_obs_date as string)
      : db.from("alerts").update({ active: false, last_triggered_at: now }).eq("id", r.id).eq("active", true);
    const { data: won } = await claim.select("id");
    if (!won?.length) continue;
    try {
      const { data: u } = await db.auth.admin.getUserById(r.user_id);
      if (!u.user?.email) throw new Error("no email");
      await sendAlertEmail({ to: u.user.email, label: rd.label, what, pageUrl: abs(rd.path), unsubUrl: abs(`/api/alerts/unsubscribe?token=${r.unsub_token}`), asOf: utc(r.condition === "changes" ? `${rd.date}T00:00:00Z` : rd.date) });
      sent++;
    } catch {
      failed++;   // undo the claim so the next run retries
      await db.from("alerts").update(r.condition === "changes" ? { last_obs_date: r.last_obs_date, last_triggered_at: null } : { active: true, last_triggered_at: null }).eq("id", r.id);
    }
  }
  return NextResponse.json({ checked: rows.length, sent, failed, baselined });
}

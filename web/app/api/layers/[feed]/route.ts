import { NextResponse } from "next/server";
import { getOrFetch } from "@/lib/cache";

/* Globe layers. Every call to the free feeds goes through the Supabase cache (golden rule 2); the browser never calls them.
   Licence notes (resolve before launch): TeleGeography cable map is CC BY-NC-SA (commercial use needs their licence);
   OpenSky is non-commercial unless licensed (anonymous: 400 credits a day, a global call costs 4); CelesTrak updates every 2 h. */
const FEEDS: Record<string, { url: string; ttl: number }> = {
  satellites: { url: process.env.SAT_URL || "https://celestrak.org/NORAD/elements/gp.php?GROUP=visual&FORMAT=json", ttl: 2 * 3600 },
  cables: { url: process.env.CAB_URL || "https://www.submarinecablemap.com/api/v3/cable/cable-geo.json", ttl: 24 * 3600 },
  aircraft: { url: process.env.AIR_URL || "https://opensky-network.org/api/states/all", ttl: 15 * 60 },
};

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ feed: string }> }) {
  const { feed } = await params;
  const f = FEEDS[feed];
  if (!f) return NextResponse.json({ error: "unknown feed" }, { status: 404 });
  try {
    const r = await getOrFetch<unknown>(`layers:${feed}`, f.ttl, async () => {
      const res = await fetch(f.url, { headers: { "User-Agent": "MeridianDev/1.0", Accept: "application/json" }, signal: AbortSignal.timeout(30000), cache: "no-store" });
      if (!res.ok) throw new Error(`upstream HTTP ${res.status}`);
      return res.json();
    });
    return NextResponse.json(r.data, { headers: { "X-Fetched-At": String(new Date(r.fetchedAt).getTime()), "X-Stale": r.stale ? "1" : "0", "Cache-Control": "no-store" } });
  } catch (e) {
    return NextResponse.json({ error: "feed unavailable", detail: e instanceof Error ? e.message : String(e) }, { status: 503 });
  }
}

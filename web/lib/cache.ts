import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type Cached<T> = { data: T; fetchedAt: string; stale: boolean };

type ErrorMarker = { __error: string };
const isMarker = (p: unknown): p is ErrorMarker => typeof p === "object" && p !== null && "__error" in p;

/** How long a failure is remembered. Plan or symbol problems (402/403/404) will not fix themselves in minutes. */
const failureTtl = (msg: string) => (/HTTP 40[234]/.test(msg) ? 6 * 3600 : 10 * 60);

/** Every external API call goes through here. Fresh cache -> return it. Else fetch, store, return.
 *  If the API fails, fall back to the last real saved data (stale: true). Failures are cached too, so a symbol the
 *  plan does not cover is not re-requested on every page view and cannot eat the free daily quota. Never invents values. */
export async function getOrFetch<T>(key: string, ttlSeconds: number, fetcher: () => Promise<T>): Promise<Cached<T>> {
  const db = supabaseAdmin();
  const { data: row } = await db.from("api_cache").select("payload, fetched_at, expires_at").eq("cache_key", key).maybeSingle();
  const fresh = row && new Date(row.expires_at).getTime() > Date.now();
  if (fresh) {
    if (isMarker(row.payload)) throw new Error(row.payload.__error);
    return { data: row.payload as T, fetchedAt: row.fetched_at, stale: false };
  }
  try {
    const data = await fetcher();
    const now = new Date();
    await db.from("api_cache").upsert({
      cache_key: key, payload: data as object,
      fetched_at: now.toISOString(), expires_at: new Date(now.getTime() + ttlSeconds * 1000).toISOString(),
    });
    return { data, fetchedAt: now.toISOString(), stale: false };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const until = new Date(Date.now() + failureTtl(msg) * 1000).toISOString();
    if (row && !isMarker(row.payload)) {
      // Keep the last real value, serve it as stale, and wait before asking the provider again.
      await db.from("api_cache").update({ expires_at: until }).eq("cache_key", key);
      return { data: row.payload as T, fetchedAt: row.fetched_at, stale: true };
    }
    await db.from("api_cache").upsert({ cache_key: key, payload: { __error: msg }, fetched_at: new Date().toISOString(), expires_at: until });
    throw err;
  }
}

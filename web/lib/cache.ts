import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type Cached<T> = { data: T; fetchedAt: string; stale: boolean };

/** Every external API call goes through here. Fresh cache -> return it. Else fetch, store, return.
 *  If the API fails, fall back to the last real saved data (stale: true). Never invents values. */
export async function getOrFetch<T>(key: string, ttlSeconds: number, fetcher: () => Promise<T>): Promise<Cached<T>> {
  const db = supabaseAdmin();
  const { data: row } = await db.from("api_cache").select("payload, fetched_at, expires_at").eq("cache_key", key).maybeSingle();
  if (row && new Date(row.expires_at).getTime() > Date.now()) {
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
    if (row) return { data: row.payload as T, fetchedAt: row.fetched_at, stale: true };
    throw err;
  }
}

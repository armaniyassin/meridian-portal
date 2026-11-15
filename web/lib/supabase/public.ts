import "server-only";
import { createClient } from "@supabase/supabase-js";

/** Anonymous server client: can only read what row level security exposes publicly (published questions). Null when env vars are missing. */
export function supabasePublic() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
}

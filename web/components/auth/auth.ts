"use client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabaseBrowser } from "@/lib/supabase/browser";

/** Opens the sign-in dialog: askSignIn("to follow NVDA"). */
export const askSignIn = (reason?: string) => { if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("mgm-auth", { detail: reason ?? "" })); };

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const db = supabaseBrowser();
    if (!db) { setReady(true); return; }
    db.auth.getSession().then(({ data }) => { setUser(data.session?.user ?? null); setReady(true); });
    const { data } = db.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, []);
  return { user, ready };
}

/** Friendly text for database errors; the free-plan limits come from triggers in schema_accounts.sql. */
export const dbMessage = (err: { message?: string } | null, limit: string) =>
  err?.message?.includes("free_limit_reached") ? limit : "Something went wrong. Try again in a moment.";

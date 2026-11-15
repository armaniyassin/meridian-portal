"use client";
import { useEffect, useState } from "react";
import { askSignIn, dbMessage, useUser } from "@/components/auth/auth";
import { toast } from "@/components/Toaster";
import { supabaseBrowser } from "@/lib/supabase/browser";

type Props = { table: "watchlist" | "saved_articles"; keyCol: "symbol" | "article_id"; keyVal: string; on: string; off: string; reason: string; limitMsg: string; doneOn: string; doneOff: string };

/** A button that adds/removes one row of the signed-in user's own list. Signed out: asks for a free account first. */
export default function ToggleSave({ table, keyCol, keyVal, on, off, reason, limitMsg, doneOn, doneOff }: Props) {
  const { user, ready } = useUser();
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const db = supabaseBrowser();
    if (!db || !user) { setSaved(false); return; }
    let live = true;
    db.from(table).select(keyCol).eq("user_id", user.id).eq(keyCol, keyVal).maybeSingle().then(({ data }) => { if (live) setSaved(!!data); });
    return () => { live = false; };
  }, [user, table, keyCol, keyVal]);

  async function click() {
    const db = supabaseBrowser();
    if (!db) { toast("Accounts aren’t available yet."); return; }
    if (!user) { askSignIn(reason); return; }
    setBusy(true);
    const { error } = saved
      ? await db.from(table).delete().eq("user_id", user.id).eq(keyCol, keyVal)
      : await db.from(table).insert({ user_id: user.id, [keyCol]: keyVal });
    setBusy(false);
    if (error) { toast(dbMessage(error, limitMsg)); return; }
    setSaved(!saved); toast(saved ? doneOff : doneOn);
  }

  return <button type="button" className="b" aria-pressed={saved} disabled={busy || !ready} onClick={click}>{saved ? on : off}</button>;
}

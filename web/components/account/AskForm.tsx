"use client";
import { useState } from "react";
import { askSignIn, useUser } from "@/components/auth/auth";
import { toast } from "@/components/Toaster";
import { supabaseBrowser } from "@/lib/supabase/browser";

export default function AskForm({ targetType, targetSlug, label }: { targetType: "ticker" | "indicator"; targetSlug: string; label: string }) {
  const { user } = useUser();
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const db = supabaseBrowser();
    if (!db) { toast("Accounts aren’t available yet."); return; }
    if (!user) { askSignIn(`to ask about ${label}`); return; }
    const text = body.trim();
    if (text.length < 10) { toast("Write at least 10 characters."); return; }
    setBusy(true);
    const { error } = await db.from("questions").insert({ user_id: user.id, target_type: targetType, target_slug: targetSlug, body: text, status: "pending" });
    setBusy(false);
    if (error) { toast("We couldn’t send your question. Try again in a moment."); return; }
    setSent(true); setBody("");
  }

  if (sent) return <p className="note" role="status">Thanks. Every question is reviewed before it is published, and we don’t give personal investment advice.</p>;
  return (
    <form className="qform" onSubmit={submit}>
      <label htmlFor={`q-${targetSlug}`} style={{ fontSize: 13, color: "var(--muted)" }}>Ask about {label} (10 to 500 characters)</label>
      <textarea id={`q-${targetSlug}`} value={body} maxLength={500} onChange={(e) => setBody(e.target.value)} />
      <div><button className="b solid" type="submit" disabled={busy}>Send question</button></div>
    </form>
  );
}

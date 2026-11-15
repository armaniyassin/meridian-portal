"use client";
import { useState } from "react";
import { askSignIn, dbMessage, useUser } from "@/components/auth/auth";
import { toast } from "@/components/Toaster";
import { supabaseBrowser } from "@/lib/supabase/browser";

type Props = { targetType: "ticker" | "indicator"; targetSlug: string; label: string };

export default function AlertForm({ targetType, targetSlug, label }: Props) {
  const { user } = useUser();
  const [cond, setCond] = useState<"above" | "below" | "changes">(targetType === "indicator" ? "changes" : "above");
  const [val, setVal] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const db = supabaseBrowser();
    if (!db) { toast("Accounts aren’t available yet."); return; }
    if (!user) { askSignIn(`to get alerts on ${label}`); return; }
    const threshold = cond === "changes" ? null : Number(val);
    if (cond !== "changes" && (val.trim() === "" || !Number.isFinite(threshold))) { toast("Enter a number for the alert level."); return; }
    setBusy(true);
    const { error } = await db.from("alerts").insert({ user_id: user.id, target_type: targetType, target_slug: targetSlug, condition: cond, threshold });
    setBusy(false);
    if (error) { toast(dbMessage(error, "Free accounts have 1 active alert. Pro, coming soon, removes the limit.")); return; }
    toast("Alert created. We’ll email you once when it triggers."); setVal("");
  }

  return (
    <section className="card mt-6" aria-labelledby="alert-h">
      <h2 id="alert-h" style={{ fontSize: 18, marginBottom: 8 }}>Email alert</h2>
      <form className="afield" onSubmit={submit}>
        <label>When {label} is
          <select value={cond} onChange={(e) => setCond(e.target.value as typeof cond)}>
            <option value="above">above</option><option value="below">below</option>
            {targetType === "indicator" && <option value="changes">updated with new data</option>}
          </select>
        </label>
        {cond !== "changes" && <label>Level<input type="number" step="any" inputMode="decimal" value={val} onChange={(e) => setVal(e.target.value)} placeholder="e.g. 150" /></label>}
        <button className="b solid" type="submit" disabled={busy}>Create alert</button>
      </form>
      <p className="note" style={{ margin: "10px 0 0" }}>Checked every 15 minutes against our cached data, so it can lag the market. Each alert emails you once and every email has an unsubscribe link. Free: 1 alert.</p>
    </section>
  );
}

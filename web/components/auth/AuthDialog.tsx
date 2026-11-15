"use client";
import { useEffect, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";

/** One sign-in dialog for the whole site, opened by askSignIn(). Passwordless: we email a sign-in link. */
export default function AuthDialog() {
  const ref = useRef<HTMLDialogElement>(null);
  const [reason, setReason] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [err, setErr] = useState("");

  useEffect(() => {
    const open = (e: Event) => { setReason((e as CustomEvent<string>).detail || ""); setState("idle"); setErr(""); ref.current?.showModal(); };
    window.addEventListener("mgm-auth", open);
    return () => window.removeEventListener("mgm-auth", open);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const db = supabaseBrowser();
    if (!db) { setState("error"); setErr("Accounts aren’t available yet."); return; }
    setState("sending");
    const { error } = await db.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: window.location.href } });
    if (error) { setState("error"); setErr("We couldn’t send the link. Check the address and try again."); } else setState("sent");
  }

  return (
    <dialog ref={ref} className="authdlg" aria-labelledby="auth-h" onClick={(e) => { if (e.target === ref.current) ref.current?.close(); }}>
      <h2 id="auth-h" style={{ fontSize: 20 }}>Create a free account</h2>
      <p className="note" style={{ margin: "6px 0 14px" }}>{reason ? `Sign in ${reason}.` : "Sign in to save and follow."} No password: we email you a link. New here? The same link creates your free account.</p>
      {state === "sent" ? (
        <p role="status">Check your inbox. The link signs you in on this page.</p>
      ) : (
        <form onSubmit={submit} className="inline-form" style={{ display: "grid", gap: 10 }}>
          <label htmlFor="auth-email" className="sr">Email</label>
          <input id="auth-email" type="email" required autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button className="b solid lg" type="submit" disabled={state === "sending"}>{state === "sending" ? "Sending…" : "Email me a link"}</button>
          {state === "error" && <p role="alert" style={{ color: "var(--downT)", fontSize: 13 }}>{err}</p>}
        </form>
      )}
      <button className="b" type="button" style={{ marginTop: 12 }} onClick={() => ref.current?.close()}>Close</button>
    </dialog>
  );
}

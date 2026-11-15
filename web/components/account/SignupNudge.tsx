"use client";
import { askSignIn, useUser } from "@/components/auth/auth";

/** Contextual nudge at the end of an article, ticker or indicator page. Only shown to visitors who are signed out. */
export default function SignupNudge({ text, reason }: { text: string; reason: string }) {
  const { user, ready } = useUser();
  if (!ready || user) return null;
  return (
    <aside className="nudge" aria-label="Free account">
      <p>{text}</p>
      <button type="button" className="b solid" onClick={() => askSignIn(reason)}>Sign up free</button>
    </aside>
  );
}

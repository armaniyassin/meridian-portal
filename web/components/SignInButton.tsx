"use client";
import { toast } from "@/components/Toaster";

/** Placeholder until Supabase Auth is connected. Says so plainly instead of doing nothing. */
export default function SignInButton() {
  return <button className="b hide-s" type="button" onClick={() => toast("Sign in arrives with Supabase Auth.")}>Sign in</button>;
}

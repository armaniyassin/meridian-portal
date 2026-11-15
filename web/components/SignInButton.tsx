"use client";
import { askSignIn, useUser } from "@/components/auth/auth";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { toast } from "@/components/Toaster";

export default function SignInButton() {
  const { user, ready } = useUser();
  if (!ready) return <span className="b hide-s" aria-hidden style={{ visibility: "hidden" }}>Sign in</span>;
  if (user) return <button className="b hide-s" type="button" onClick={async () => { await supabaseBrowser()?.auth.signOut(); toast("Signed out."); }}>Sign out</button>;
  return <button className="b hide-s" type="button" onClick={() => askSignIn()}>Sign in</button>;
}

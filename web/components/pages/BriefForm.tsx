"use client";
import { toast } from "@/components/Toaster";

/** Preview only: nothing is sent or stored until Resend and the consent log are connected (Dept 05, 06). */
export default function BriefForm() {
  return (
    <form className="form" onSubmit={(e) => { e.preventDefault(); toast("Preview only. Nothing was sent and nothing was stored."); }}>
      <label className="lab" htmlFor="em">Email address</label>
      <input type="email" id="em" placeholder="you@example.com" autoComplete="email" required />
      <label className="lab" htmlFor="lv">Your level</label>
      <select id="lv" defaultValue="beginner"><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select>
      <label className="c"><input type="checkbox" required /> I accept the privacy policy and understand I can unsubscribe in one click.</label>
      <div><button className="b solid lg" type="submit">Join the brief</button></div>
    </form>
  );
}

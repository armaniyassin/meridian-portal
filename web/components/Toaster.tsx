"use client";
import { useEffect, useState } from "react";

/** Fire a short message from anywhere: toast("Saved"). Rendered once in the layout. */
export const toast = (message: string) => { if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("mgm-toast", { detail: message })); };

export default function Toaster() {
  const [msg, setMsg] = useState("");
  const [on, setOn] = useState(false);
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const h = (e: Event) => { setMsg((e as CustomEvent<string>).detail); setOn(true); clearTimeout(t); t = setTimeout(() => setOn(false), 3400); };
    window.addEventListener("mgm-toast", h);
    return () => { window.removeEventListener("mgm-toast", h); clearTimeout(t); };
  }, []);
  return <div className={`toast ${on ? "on" : ""}`} role="status" aria-live="polite">{msg}</div>;
}

"use client";
import { useEffect, useRef } from "react";
import { toast } from "@/components/Toaster";

/** Closing call to action: a dotted wave terrain that reacts to the pointer, and the email form. Preview only until Resend is connected. */
export default function BriefCta() {
  const sec = useRef<HTMLElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wv = cv.current, host = sec.current; if (!wv || !host) return;
    const wx = wv.getContext("2d"); if (!wx) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let mx = -1e3, my = -1e3, raf = 0, visible = true;
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }); io.observe(host);
    const frame = (t: number) => {
      raf = requestAnimationFrame(frame);
      if (!visible) return;
      const r = wv.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2);
      if (wv.width !== Math.round(r.width * d)) { wv.width = Math.round(r.width * d); wv.height = Math.round(r.height * d); }
      wx.setTransform(d, 0, 0, d, 0, 0); wx.clearRect(0, 0, r.width, r.height);
      const cols = Math.max(40, Math.floor(r.width / 16)), rows = 18, dark = document.documentElement.dataset.theme === "dark" || (!document.documentElement.dataset.theme && matchMedia("(prefers-color-scheme: dark)").matches);
      const s = (t / 1000) * (reduce ? 0 : 1);
      for (let j = 0; j < rows; j++) {
        const f = j / (rows - 1), y0 = r.height * (0.28 + 0.7 * f * f), sc = 0.55 + f * 1.1;
        for (let i = 0; i < cols; i++) {
          const x = ((i + 0.5) / cols) * r.width;
          let y = y0 + Math.sin(i * 0.22 + s * 0.8 + j * 0.55) * 14 * f + Math.sin(i * 0.07 - s * 0.5) * 10 * f;
          const dd = Math.hypot(x - mx, y - my); if (dd < 110) y -= (1 - dd / 110) * 18;
          const a = (0.12 + 0.7 * f) * (dd < 110 ? 1.3 : 1);
          wx.fillStyle = dark ? `rgba(180,208,255,${Math.min(1, a)})` : `rgba(27,79,216,${Math.min(1, a)})`;
          wx.fillRect(x, y, 1.6 * sc, 1.6 * sc);
        }
      }
    };
    raf = requestAnimationFrame(frame);
    const mv = (e: PointerEvent) => { const r = wv.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; };
    const lv = () => { mx = my = -1e3; };
    host.addEventListener("pointermove", mv); host.addEventListener("pointerleave", lv);
    return () => { cancelAnimationFrame(raf); io.disconnect(); host.removeEventListener("pointermove", mv); host.removeEventListener("pointerleave", lv); };
  }, []);

  return (
    <section className="cta-sec" id="ctaSec" ref={sec}>
      <canvas id="wave" ref={cv} aria-hidden="true" />
      <div className="in wrap">
        <div className="eyebrow rv">Weekly brief</div>
        <h2 className="two fx" style={{ marginTop: 12 }}>Follow the sun. <span className="dim">Get the Sunday summary.</span></h2>
        <p className="lede rv" style={{ margin: "0 auto" }}>One email a week on macro and markets, written for your level.</p>
        <form className="inline-form" onSubmit={(e) => { e.preventDefault(); toast("Preview only. Nothing was sent and nothing was stored."); }}>
          <label className="sr" htmlFor="hEm">Email address</label>
          <input type="email" id="hEm" placeholder="you@example.com" autoComplete="email" required />
          <button className="b solid lg" type="submit">Join the brief</button>
          <label className="consent"><input type="checkbox" required /> I accept the privacy policy and understand I can unsubscribe in one click.</label>
        </form>
      </div>
    </section>
  );
}

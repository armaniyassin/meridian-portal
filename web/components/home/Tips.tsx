"use client";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { TIPS } from "@/lib/content";
import Vis from "@/components/Vis";

const Chevron = ({ d }: { d: string }) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>;
const pad = (n: number) => String(n).padStart(2, "0");

/** Scroll-snap carousel of eleven illustrated tips. Drag with a mouse, swipe on touch, or use the arrows or keyboard. */
export default function Tips() {
  const tr = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLElement>(null);
  const drag = useRef<{ x: number; s: number; m: boolean } | null>(null);
  const step = () => (tr.current?.querySelector<HTMLElement>(".tip")?.offsetWidth ?? 340) + 16;
  const reduce = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const by = (d: number) => tr.current?.scrollBy({ left: d * step(), behavior: reduce() ? "auto" : "smooth" });

  useEffect(() => {
    const el = tr.current; if (!el) return;
    const upd = () => { const m = el.scrollWidth - el.clientWidth, f = m > 0 ? el.scrollLeft / m : 0; if (bar.current) bar.current.style.width = `${12 + 88 * f}%`;
      if (m > 0 && el.scrollLeft >= m - 6) window.dispatchEvent(new Event("mgm-tips-end")); };
    el.addEventListener("scroll", upd, { passive: true }); upd();
    const move = (e: PointerEvent) => { const d = drag.current; if (!d) return; const dx = e.clientX - d.x; if (Math.abs(dx) > 4) { d.m = true; el.style.scrollSnapType = "none"; el.classList.add("dragging"); el.scrollLeft = d.s - dx; } };
    const up = () => { const d = drag.current; if (!d) return; drag.current = null; el.classList.remove("dragging"); el.style.scrollSnapType = ""; if (d.m) { const s = step(); el.scrollTo({ left: Math.round(el.scrollLeft / s) * s, behavior: "smooth" }); } };
    addEventListener("pointermove", move); addEventListener("pointerup", up);
    return () => { el.removeEventListener("scroll", upd); removeEventListener("pointermove", move); removeEventListener("pointerup", up); };
  }, []);

  return (
    <>
      <div className="tipwrap">
        <div className="tiptrack" ref={tr} tabIndex={0} role="region" aria-label="Tips and facts carousel"
          onKeyDown={(e) => { if (e.key === "ArrowRight") { e.preventDefault(); by(1); } else if (e.key === "ArrowLeft") { e.preventDefault(); by(-1); } }}
          onPointerDown={(e) => { if (e.pointerType === "mouse" && tr.current) drag.current = { x: e.clientX, s: tr.current.scrollLeft, m: false }; }}>
          {TIPS.map((x, i) => (
            <article className="tip" key={x.t}>
              <Vis k={x.v} />
              <div className="tb">
                <span className="tcat">{x.cat} · Tip {pad(i + 1)}</span>
                <h3>{x.t}</h3>
                <p>{x.d}</p>
                {x.a ? <Link className="tl" href={`/news/${x.a}`} draggable={false}>Read the explainer <Chevron d="M5 12h14M13 6l6 6-6 6" /></Link> : <span className="tl" aria-hidden="true" style={{ opacity: 0 }}>.</span>}
              </div>
            </article>
          ))}
        </div>
      </div>
      <div className="wrap">
        <div className="tipctl">
          <div className="tipprog" aria-hidden="true"><i ref={bar} /></div>
          <button type="button" aria-label="Previous tips" onClick={() => by(-1)}><Chevron d="M15 6l-6 6 6 6" /></button>
          <button type="button" aria-label="Next tips" onClick={() => by(1)}><Chevron d="M9 6l6 6-6 6" /></button>
        </div>
      </div>
    </>
  );
}

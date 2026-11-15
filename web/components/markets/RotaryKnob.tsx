"use client";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { PERIODS } from "@/lib/periods";

/** Period bar slider (file keeps its old name so imports do not change). A row of bars: the ones up to the value are lit, a soft wave dips
 *  around the handle, and a small badge with the period rolls above it. It moves freely from 1D to 5Y, and a light magnet pulls the handle
 *  onto each main period as it passes. Drag, tap the row, or use the keys. No extra packages. */
const N = PERIODS.length, PER = 7, BARS = (N - 1) * PER + 1, MAG = 0.3; // PER bars between periods; MAG = magnet reach in period units
const nearest = (v: number) => Math.max(0, Math.min(N - 1, Math.round(v)));
const magnet = (v: number) => { const i = nearest(v), d = v - i, k = Math.abs(d) / MAG; return k >= 1 ? v : i + d * (0.2 + 0.8 * k * k); };
const reduced = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function RotaryKnob({ idx, onChange, label }: { idx: number; onChange: (i: number) => void; label: string }) {
  const bars = useMemo(() => Array.from({ length: BARS }, (_, i) => i), []);
  const root = useRef<HTMLDivElement>(null), badge = useRef<HTMLDivElement>(null), els = useRef<(HTMLSpanElement | null)[]>([]);
  const st = useRef({ pos: idx, vel: 0, target: idx, raw: idx, dragging: false });
  const raf = useRef(0), running = useRef(false), last = useRef(0), cur = useRef(idx), prev = useRef(idx);
  const [shown, setShown] = useState({ idx, dir: 1 });
  if (shown.idx !== idx) setShown({ idx, dir: idx > shown.idx ? 1 : -1 });
  cur.current = idx;

  const paint = () => {
    const s = st.current, p = s.pos * PER; // handle position in bar units
    els.current.forEach((e, i) => {
      if (!e) return;
      const d = (i - p) / 3.4, h = 1 - 0.5 * Math.exp(-d * d); // dip around the handle
      e.style.transform = `scaleY(${(i % PER === 0 ? Math.min(1, h + 0.12) : h).toFixed(3)})`;
      const lit = i <= p + 0.5; if (e.hasAttribute("data-lit") !== lit) e.toggleAttribute("data-lit", lit);
    });
    if (badge.current) badge.current.style.left = `${(Math.max(0, Math.min(N - 1, s.pos)) / (N - 1)) * 100}%`;
  };
  const frame = () => {
    const s = st.current, now = performance.now(), dt = Math.min(0.04, (now - last.current) / 1000); last.current = now;
    if (reduced()) { s.pos = s.target; s.vel = 0; }
    else {
      const K = s.dragging ? 520 : 260, Z = s.dragging ? 1 : 0.7; // held: glides after the hand. Released: a small settle
      for (let k = 0; k < 3; k++) { const a = K * (s.target - s.pos) - 2 * Z * Math.sqrt(K) * s.vel; s.vel += a * (dt / 3); s.pos += s.vel * (dt / 3); }
    }
    paint();
    if (s.dragging || Math.abs(s.target - s.pos) > 0.002 || Math.abs(s.vel) > 0.01) raf.current = requestAnimationFrame(frame); else running.current = false;
  };
  const kick = () => { if (running.current) return; running.current = true; last.current = performance.now(); raf.current = requestAnimationFrame(frame); };
  useEffect(() => { paint(); return () => cancelAnimationFrame(raf.current); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { // changed from outside
    if (prev.current === idx) return; prev.current = idx;
    if (!st.current.dragging && Math.abs(st.current.target - idx) > MAG) { st.current.raw = st.current.target = idx; kick(); }
  }, [idx]); // eslint-disable-line react-hooks/exhaustive-deps

  const track = (e: PointerEvent<HTMLDivElement>) => {
    const r = root.current!.getBoundingClientRect(), s = st.current;
    const v = Math.max(0, Math.min(N - 1, ((e.clientX - r.left - 6) / (r.width - 12)) * (N - 1)));
    s.raw = v; s.target = magnet(v);
    const i = nearest(v); if (i !== cur.current) { cur.current = i; onChange(i); }
    kick();
  };
  const end = () => {
    const s = st.current; if (!s.dragging) return; s.dragging = false;
    const i = nearest(s.raw); if (Math.abs(s.raw - i) < MAG * 0.7) s.target = i; // let go close to a period: settle on it
    s.raw = s.target; kick();
  };
  const key = (e: KeyboardEvent) => {
    const m: Record<string, number> = { ArrowRight: cur.current + 1, ArrowUp: cur.current + 1, PageUp: cur.current + 1, ArrowLeft: cur.current - 1, ArrowDown: cur.current - 1, PageDown: cur.current - 1, Home: 0, End: N - 1 };
    const to = m[e.key]; if (to == null) return; e.preventDefault();
    const i = Math.max(0, Math.min(N - 1, to)); st.current.raw = st.current.target = i; kick();
    if (i !== cur.current) { cur.current = i; onChange(i); }
  };

  return (
    <div className="bs" ref={root} role="slider" tabIndex={0} aria-label={`${label}: time period`} aria-valuemin={0} aria-valuemax={N - 1} aria-valuenow={idx} aria-valuetext={PERIODS[idx][1]}
      onPointerDown={(e) => { if (e.button !== 0) return; e.currentTarget.setPointerCapture(e.pointerId); st.current.dragging = true; track(e); }}
      onPointerMove={(e) => { if (st.current.dragging) track(e); }} onPointerUp={end} onPointerCancel={end} onKeyDown={key}>
      <div className="bs-top" aria-hidden="true"><div className="bs-badge" ref={badge}><span key={shown.idx} className={shown.dir > 0 ? "bs-up" : "bs-dn"}>{PERIODS[idx][0]}</span></div></div>
      <div className="bs-row" aria-hidden="true">{bars.map((i) => <span key={i} ref={(n) => { els.current[i] = n; }} className={i % PER === 0 ? "bs-b bs-m" : "bs-b"} />)}</div>
      <div className="bs-lab" aria-hidden="true">{PERIODS.map((p, i) => <span key={p[0]} style={{ left: `calc(7px + (100% - 14px) * ${i / (N - 1)})` }}>{p[0]}</span>)}</div>
    </div>
  );
}

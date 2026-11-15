"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { Bar } from "@/lib/periods";

/** Small floating preview of the last year of a ticker, drawn from the same cached daily history the chart uses. Decorative: the full chart and the numbers are in the dialog. */
const cache = new Map<string, Promise<Bar[]>>();
const load = (symbol: string) => {
  let p = cache.get(symbol);
  if (!p) {
    p = fetch(`/api/candles?symbol=${encodeURIComponent(symbol)}&period=1Y`).then((r) => r.json()).then((j) => (Array.isArray(j.bars) ? (j.bars as Bar[]) : []));
    p.catch(() => cache.delete(symbol)); cache.set(symbol, p);
  }
  return p;
};
const W = 236, H = 84;

export default function HoverPreview({ symbol, label, rect, bond, decimals = 2 }: { symbol: string; label: string; rect: DOMRect; bond?: boolean; decimals?: number }) {
  const [bars, setBars] = useState<Bar[] | null | "none">(null);
  useEffect(() => { let alive = true; setBars(null); load(symbol).then((b) => alive && setBars(b.length > 1 ? b : "none")).catch(() => alive && setBars("none")); return () => { alive = false; }; }, [symbol]);
  const left = Math.max(8, Math.min(innerWidth - W - 36, rect.left + rect.width / 2 - (W + 28) / 2));
  const below = rect.bottom + 8 + H + 56 < innerHeight, top = below ? rect.bottom + 8 : rect.top - H - 64;
  let body;
  if (bars === null) body = <p className="hp-note">Loading…</p>;
  else if (bars === "none") body = <p className="hp-note">No history to preview.</p>;
  else {
    const c = bars.map((b) => b[4]), lo = Math.min(...c), hi = Math.max(...c), span = hi - lo || 1;
    const X = (i: number) => (i / (c.length - 1)) * W, Y = (v: number) => 6 + (1 - (v - lo) / span) * (H - 12);
    const line = c.map((v, i) => `${i ? "L" : "M"}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join(" ");
    const chg = bond ? (c[c.length - 1] - c[0]) * 100 : (c[c.length - 1] / c[0] - 1) * 100, up = chg >= 0, col = up ? "var(--up)" : "var(--down)";
    const gid = `hp${symbol.replace(/\W/g, "")}`;
    body = (<>
      <div className="hp-head"><span>Past year</span><b className={`font-mono ${up ? "text-upt" : "text-downt"}`}>{up ? "▲ +" : "▼ "}{bond ? `${chg.toFixed(0)} bp` : `${chg.toFixed(2)}%`}</b></div>
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} aria-hidden="true">
        <defs><linearGradient id={gid} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={col} stopOpacity=".28" /><stop offset="1" stopColor={col} stopOpacity="0" /></linearGradient></defs>
        <path d={`${line} L${W} ${H} L0 ${H} Z`} fill={`url(#${gid})`} /><path d={line} fill="none" stroke={col} strokeWidth="1.8" strokeLinejoin="round" />
        <circle cx={X(c.length - 1)} cy={Y(c[c.length - 1])} r="3" fill={col} />
      </svg>
      <div className="hp-foot font-mono"><span>{lo.toFixed(decimals)}</span><span>{hi.toFixed(decimals)}</span></div>
    </>);
  }
  // rendered on <body>: a transformed card (hover lift) would otherwise become the containing block of a fixed element
  return createPortal(<div className="hp" style={{ left, top }} aria-hidden="true"><div className="hp-t">{label}</div>{body}</div>, document.body);
}

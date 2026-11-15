"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Bar } from "@/lib/periods";

const W = 920, H = 400, PT = 12, PB = 30, PR = 62, VH = 64, PH = H - PT - PB - VH - 8;
export const fdate = (t: number, intraday: boolean) =>
  new Date(t).toLocaleString("en-GB", intraday ? { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "UTC" } : { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

/** TradingView-style chart: candles (or a line when the series only has closes), volume, crosshair with readout, scroll to zoom, drag to pan. */
export default function CandleChart({ bars, type, decimals, intraday, view, onView }: {
  bars: Bar[]; type: "candle" | "line"; decimals: number; intraday: boolean; view: [number, number]; onView: (v0: number, v1: number) => void;
}) {
  const n = bars.length;
  const i0 = Math.max(0, Math.floor(view[0] * n)), i1 = Math.min(n, Math.max(i0 + 2, Math.ceil(view[1] * n)));
  const a = useMemo(() => bars.slice(i0, i1), [bars, i0, i1]);
  const m = a.length;
  const candle = type === "candle" && a.every((b) => b[1] != null && b[2] != null && b[3] != null);
  const [hover, setHover] = useState<{ i: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null), drag = useRef<{ f: number; v0: number } | null>(null);
  const viewRef = useRef(view); viewRef.current = view;

  const g = useMemo(() => {
    if (!m) return null;
    const lows = a.map((b) => (candle ? (b[3] as number) : b[4])), highs = a.map((b) => (candle ? (b[2] as number) : b[4]));
    const lo = Math.min(...lows), hi = Math.max(...highs), pad = (hi - lo || Math.abs(hi) * 0.02 || 1) * 0.06, y0 = lo - pad, y1 = hi + pad;
    const cw = (W - PR) / m, vmax = Math.max(0, ...a.map((b) => b[5] ?? 0));
    const X = (i: number) => (i + 0.5) * cw, Y = (v: number) => PT + ((y1 - v) / (y1 - y0)) * PH, bw = Math.max(1, Math.min(14, cw * 0.7));
    return { y0, y1, cw, vmax, X, Y, bw };
  }, [a, m, candle]);

  useEffect(() => {
    const el = svgRef.current; if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect(), f = Math.max(0, Math.min(1, ((e.clientX - r.left) / r.width) * (W / (W - PR)))), [v0, v1] = viewRef.current, span = v1 - v0;
      const ns = Math.max(Math.min(1, 12 / Math.max(n, 12)), Math.min(1, span * (e.deltaY > 0 ? 1.18 : 0.85)));
      const nv0 = Math.max(0, Math.min(1 - ns, v0 + f * span - f * ns)); onView(nv0, nv0 + ns);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [n, onView]);

  if (!g) return null;
  const loc = (e: React.PointerEvent) => { const r = svgRef.current!.getBoundingClientRect(); return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H }; };
  const onMove = (e: React.PointerEvent) => {
    const p = loc(e);
    if (drag.current) { const span = view[1] - view[0], nv0 = Math.max(0, Math.min(1 - span, drag.current.v0 + (drag.current.f - p.x / (W - PR)) * span)); onView(nv0, nv0 + span); return; }
    setHover({ i: Math.max(0, Math.min(m - 1, Math.floor(p.x / g.cw))), y: p.y });
  };
  const hb = a[hover ? hover.i : m - 1];
  const up = a[m - 1][4] >= (a[0][1] ?? a[0][4]);
  const col = (b: Bar) => ((b[1] == null ? true : b[4] >= b[1]) ? "var(--up)" : "var(--down)");
  const line = a.map((b, i) => `${i ? "L" : "M"}${g.X(i).toFixed(1)} ${g.Y(b[4]).toFixed(1)}`).join(" ");
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(f * (m - 1)));
  return (
    <div>
      <div className="cc-ro font-mono" aria-live="off">
        <span>{fdate(hb[0], intraday)}</span>
        {hb[1] != null && <><span>O {hb[1].toFixed(decimals)}</span><span>H {(hb[2] as number).toFixed(decimals)}</span><span>L {(hb[3] as number).toFixed(decimals)}</span></>}
        <span>C {hb[4].toFixed(decimals)}</span>{hb[5] != null && hb[5] > 0 && <span>Vol {hb[5] >= 1e9 ? (hb[5] / 1e9).toFixed(2) + "B" : hb[5] >= 1e6 ? (hb[5] / 1e6).toFixed(2) + "M" : hb[5].toLocaleString("en-US")}</span>}
      </div>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Price chart" className="cc-svg">
        {[0, 1, 2, 3, 4].map((i) => {
          const y = PT + (i * PH) / 4, v = g.y1 - ((g.y1 - g.y0) * i) / 4;
          return <g key={i}><line x1={0} x2={W - PR} y1={y} y2={y} stroke="var(--line)" strokeDasharray="3 5" /><text x={W - PR + 8} y={y + 4} fill="var(--muted)" fontSize={11} fontFamily="var(--mono)">{v.toFixed(decimals)}</text></g>;
        })}
        {ticks.map((ix, k) => (
          <text key={k} x={Math.max(18, Math.min(W - PR - 18, g.X(ix)))} y={H - 10} textAnchor={k === 0 ? "start" : k === 4 ? "end" : "middle"} fill="var(--muted)" fontSize={11}>{fdate(a[ix][0], intraday)}</text>
        ))}
        {candle ? a.map((b, i) => {
          const x = g.X(i), yo = g.Y(b[1] as number), yc = g.Y(b[4]), c = col(b);
          return <g key={i}><line x1={x} x2={x} y1={g.Y(b[2] as number)} y2={g.Y(b[3] as number)} stroke={c} strokeWidth={1} /><rect x={x - g.bw / 2} y={Math.min(yo, yc)} width={g.bw} height={Math.max(1, Math.abs(yo - yc))} fill={c} /></g>;
        }) : <>
          <path d={`${line} L${g.X(m - 1)} ${PT + PH} L${g.X(0)} ${PT + PH} Z`} fill={up ? "var(--up)" : "var(--down)"} opacity={0.12} />
          <path d={line} fill="none" stroke={up ? "var(--up)" : "var(--down)"} strokeWidth={2} strokeLinejoin="round" />
        </>}
        {g.vmax > 0 && a.map((b, i) => { const h = ((b[5] ?? 0) / g.vmax) * VH; return <rect key={i} x={g.X(i) - g.bw / 2} y={PT + PH + 8 + VH - h} width={g.bw} height={h} fill={col(b)} opacity={0.35} />; })}
        {hover && <g pointerEvents="none">
          <line x1={g.X(hover.i)} x2={g.X(hover.i)} y1={PT} y2={PT + PH + 8 + VH} stroke="var(--muted)" strokeDasharray="3 3" />
          {hover.y >= PT && hover.y <= PT + PH && <>
            <line x1={0} x2={W - PR} y1={hover.y} y2={hover.y} stroke="var(--muted)" strokeDasharray="3 3" />
            <rect x={W - PR} y={hover.y - 9} width={PR - 2} height={18} rx={4} fill="var(--text)" />
            <text x={W - PR + 6} y={hover.y + 4} fill="var(--surface)" fontSize={11} fontFamily="var(--mono)">{(g.y1 - ((hover.y - PT) / PH) * (g.y1 - g.y0)).toFixed(decimals)}</text>
          </>}
        </g>}
        <rect x={0} y={0} width={W - PR} height={H} fill="transparent" style={{ cursor: "crosshair", touchAction: "none" }}
          onPointerMove={onMove} onPointerLeave={() => setHover(null)}
          onPointerDown={(e) => { (e.target as Element).setPointerCapture(e.pointerId); drag.current = { f: loc(e).x / (W - PR), v0: view[0] }; }}
          onPointerUp={() => { drag.current = null; }} />
      </svg>
    </div>
  );
}

"use client";
import { useEffect, useMemo, useState } from "react";
import { HUBS, HUB_COUNT_WORD, isOpen } from "@/lib/hubs";
import { sessionSeries, type Range, type Zone } from "@/lib/sessions";

const clock = (tz: string, t: number) => new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(t));

export default function Sessions() {
  const [now, setNow] = useState<number | null>(null);
  const [range, setRange] = useState<Range>("day");
  const [zone, setZone] = useState<Zone>("utc");
  const [idx, setIdx] = useState<number | null>(null);

  useEffect(() => { setNow(Date.now()); const id = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(id); }, []);
  const s = useMemo(() => (now ? sessionSeries(now, range, zone) : null), [now, range, zone]);
  if (!now || !s) return <p className="note">Loading exchange sessions…</p>;

  const W = 640, H = 210, px = 6, top = 14, bot = 8, n = s.vals.length, max = Math.max(1, ...s.vals);
  const X = (i: number) => px + (i * (W - 2 * px)) / (n - 1), Y = (v: number) => H - bot - (v / max) * (H - top - bot);
  const line = s.vals.map((v, i) => `${i ? "L" : "M"}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join(" ");
  const active = idx ?? (s.nowIdx >= 0 ? s.nowIdx : null);
  const openN = HUBS.filter((h) => isOpen(h, now)).length;
  const move = (d: number) => setIdx((c) => Math.max(0, Math.min(n - 1, (c ?? (s.nowIdx >= 0 ? s.nowIdx : 0)) + d)));

  const seg = (label: string, on: boolean, fn: () => void) => (
    <button type="button" aria-pressed={on} onClick={fn} className={`rounded-md px-3 py-1.5 text-sm font-semibold ${on ? "bg-surface2" : "text-muted"}`}>{label}</button>
  );

  return (
    <div className="grid gap-5 md:grid-cols-[2fr_1fr]">
      <div className="card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">Exchanges open now</h2>
            <p className="mt-1 text-3xl font-semibold tabular-nums">{openN}<small className="ml-2 text-sm font-normal text-muted">of {HUBS.length} · {s.sub}</small></p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div role="group" aria-label="Range" className="flex rounded-lg border border-line p-0.5">{seg("Day", range === "day", () => { setRange("day"); setIdx(null); })}{seg("Week", range === "week", () => { setRange("week"); setIdx(null); })}</div>
            {range === "day" && <div role="group" aria-label="Time zone" className="flex rounded-lg border border-line p-0.5">{seg("UTC", zone === "utc", () => setZone("utc"))}{seg("Local", zone === "local", () => setZone("local"))}</div>}
          </div>
        </div>
        <div
          className="relative mt-4 rounded-lg outline-offset-4" role="group" tabIndex={0}
          aria-label="Exchanges open by time. Use the left and right arrow keys to move through the chart."
          onKeyDown={(e) => { if (e.key === "ArrowRight") { e.preventDefault(); move(1); } if (e.key === "ArrowLeft") { e.preventDefault(); move(-1); } if (e.key === "Home") setIdx(0); if (e.key === "End") setIdx(n - 1); if (e.key === "Escape") setIdx(null); }}
          onPointerMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); setIdx(Math.round(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * (n - 1))); }}
          onPointerLeave={() => setIdx(null)}
        >
          <svg viewBox={`0 0 ${W} ${H}`} aria-hidden="true" className="block w-full">
            <defs><linearGradient id="ag" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="var(--accent)" stopOpacity=".38" /><stop offset="1" stopColor="var(--accent)" stopOpacity="0" /></linearGradient></defs>
            {[0, 1, 2, 3].map((i) => { const y = top + (i * (H - top - bot)) / 3; return <line key={i} x1="0" x2={W} y1={y} y2={y} stroke="var(--line)" strokeDasharray="3 5" />; })}
            <path d={`${line} L${X(n - 1)} ${H - bot} L${X(0)} ${H - bot} Z`} fill="url(#ag)" />
            <path d={line} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" />
            {active != null && <><line x1={X(active)} x2={X(active)} y1={top} y2={H - bot} stroke="var(--muted)" strokeDasharray="2 3" /><circle cx={X(active)} cy={Y(s.vals[active])} r="4.5" fill="var(--accent)" stroke="var(--surface)" strokeWidth="2" /></>}
            <text x="2" y={top - 3} fontSize="10" fill="var(--muted)" fontFamily="var(--font-mono)">{max}</text>
          </svg>
        </div>
        <div className="mt-1 flex justify-between font-mono text-[11px] text-muted" aria-hidden="true">{s.axis.map((a) => <span key={a}>{a}</span>)}</div>
        <p className="mt-3 min-h-6 text-sm" aria-live="polite">{active != null ? s.desc[active] + (idx == null ? " (now)" : "") : "Move over the chart, or focus it and use the arrow keys, for details."}</p>
        <table className="sr-only"><caption>Exchanges open, by {range === "day" ? "hour" : "day"}</caption><tbody>{s.desc.map((d) => <tr key={d}><td>{d}</td></tr>)}</tbody></table>
      </div>
      <div className="card">
        <h2 className="text-sm font-semibold">How to read this</h2>
        <p className="note mt-2 text-[13.5px]">The line counts how many of the {HUB_COUNT_WORD} exchanges are in their regular session at each hour. Sessions overlap when Europe closes and New York opens, and when Asia hands over to Europe.</p>
        <p className="note mt-2 text-[13.5px]">Most exchanges are closed on Saturday and Sunday. Cairo trades Sunday to Thursday. Holidays are not included. This chart shows published trading hours, not prices.</p>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2 md:col-span-2 lg:grid-cols-4">
        {HUBS.map((h) => { const o = isOpen(h, now); return (
          <li key={h.id} className="rounded-lg border border-line bg-surface p-3 text-sm">
            <div className="flex items-center justify-between"><b>{h.name}</b><span className={`rounded px-2 py-0.5 font-mono text-[11px] ${o ? "bg-surface2 text-upt" : "bg-surface2 text-muted"}`}>{o ? "Open" : "Closed"}</span></div>
            <div className="mt-1 text-xs text-muted">{h.ex}</div>
            <div className="mt-1 font-mono text-xs">Local time {clock(h.tz, now)}</div>
          </li>); })}
      </ul>
    </div>
  );
}

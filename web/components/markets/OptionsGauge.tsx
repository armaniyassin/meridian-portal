/** Put/call ratio gauge. Below 0.70 reads bullish, above 1.00 bearish. Shows an honest empty state until a feed exists. */
const LO = 0.7, HI = 1.0, MIN = 0.5, MAX = 1.2;
const PARTS = ["Indices", "Stocks", "Bonds", "Currencies"] as const;

export type OptionsData = { overall: number | null; by?: Partial<Record<(typeof PARTS)[number], number | null>> };

function reading(p: number | null | undefined) {
  if (p == null) return null;
  return { label: p < LO ? "Bullish" : p > HI ? "Bearish" : "Neutral", f: Math.max(0, Math.min(1, (MAX - p) / (MAX - MIN))) };
}

function Gauge({ pcr, name }: { pcr: number | null | undefined; name: string }) {
  const r = reading(pcr);
  const cx = 150, cy = 150, R = 112;
  const pt = (f: number, rr: number) => [cx + rr * Math.cos(Math.PI * (1 - f)), cy - rr * Math.sin(Math.PI * (1 - f))];
  const f1 = (MAX - HI) / (MAX - MIN), f2 = (MAX - LO) / (MAX - MIN);
  const arc = (a: number, b: number, color: string) => {
    const A = pt(a, R), B = pt(b, R);
    return <path d={`M${A[0].toFixed(1)} ${A[1].toFixed(1)} A${R} ${R} 0 0 1 ${B[0].toFixed(1)} ${B[1].toFixed(1)}`} fill="none" stroke={color} strokeWidth="16" opacity={r ? 0.9 : 0.35} />;
  };
  const N = r ? pt(r.f, R - 22) : null;
  return (
    <svg viewBox="0 0 300 175" role="img" aria-label={`${name} options sentiment: ${r ? `${r.label}, put/call ${pcr!.toFixed(2)}` : "awaiting data feed"}`} className="mx-auto w-full">
      {arc(0, f1 - 0.004, "var(--down)")}{arc(f1, f2, "var(--muted)")}{arc(f2 + 0.004, 1, "var(--up)")}
      {N && <><line x1={cx} y1={cy} x2={N[0]} y2={N[1]} stroke="var(--text)" strokeWidth="3" strokeLinecap="round" /><circle cx={cx} cy={cy} r="6" fill="var(--text)" /></>}
      <text x={cx - R} y="170" textAnchor="middle" fontSize="11" fill="var(--muted)">Bearish</text>
      <text x={cx + R} y="170" textAnchor="middle" fontSize="11" fill="var(--muted)">Bullish</text>
    </svg>
  );
}

export default function OptionsGauge({ data, parts = true }: { data: OptionsData; parts?: boolean }) {
  const r = reading(data.overall);
  return (
    <div>
      <div className="mx-auto max-w-xs text-center">
        <Gauge pcr={data.overall} name="Overall" />
        <p className="text-xl font-semibold" aria-live="polite">{r ? r.label : "—"}</p>
        <p className="note">{r ? `Overall put/call ${data.overall!.toFixed(2)}` : "Overall · awaiting feed"}</p>
      </div>
      {parts && (
        <ul className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {PARTS.map((n) => {
            const v = data.by?.[n], x = reading(v);
            return (
              <li key={n} className="rounded-lg border border-line p-3 text-center">
                <div className="text-sm font-semibold">{n}</div>
                <Gauge pcr={v} name={n} />
                <div className={`text-sm font-semibold ${x?.label === "Bullish" ? "text-upt" : x?.label === "Bearish" ? "text-downt" : ""}`}>{x ? x.label : "—"}</div>
                <div className="note">{x ? `P/C ${v!.toFixed(2)}` : "Awaiting feed"}</div>
              </li>
            );
          })}
        </ul>
      )}
      <p className="note mt-4">One overall reading, then the same bullish or bearish reading for indices, stocks, bonds and currencies. Puts bought against calls bought: fewer puts than calls leans bullish, more puts leans bearish. Source to be confirmed.</p>
    </div>
  );
}

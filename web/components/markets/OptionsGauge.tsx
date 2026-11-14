/** Put/call ratio gauge. Below 0.70 reads bullish, above 1.00 bearish. Shows an honest empty state until a feed exists. */
const LO = 0.7, HI = 1.0, MIN = 0.5, MAX = 1.2;

function reading(p: number | null) {
  if (p == null) return null;
  return { label: p < LO ? "Bullish" : p > HI ? "Bearish" : "Neutral", f: Math.max(0, Math.min(1, (MAX - p) / (MAX - MIN))) };
}

export default function OptionsGauge({ pcr }: { pcr: number | null }) {
  const r = reading(pcr);
  const cx = 150, cy = 150, R = 112;
  const pt = (f: number, rr: number) => [cx + rr * Math.cos(Math.PI * (1 - f)), cy - rr * Math.sin(Math.PI * (1 - f))];
  const f1 = (MAX - HI) / (MAX - MIN), f2 = (MAX - LO) / (MAX - MIN);
  const arc = (a: number, b: number, color: string) => {
    const A = pt(a, R), B = pt(b, R);
    return <path d={`M${A[0].toFixed(1)} ${A[1].toFixed(1)} A${R} ${R} 0 0 1 ${B[0].toFixed(1)} ${B[1].toFixed(1)}`} fill="none" stroke={color} strokeWidth="16" opacity={r ? 0.9 : 0.35} />;
  };
  const N = r ? pt(r.f, R - 22) : null;
  const text = r ? `${r.label} (put/call ${pcr!.toFixed(2)})` : "Awaiting data feed";
  return (
    <div className="text-center">
      <svg viewBox="0 0 300 175" role="img" aria-label={`Options sentiment gauge: ${text}`} className="mx-auto w-full max-w-xs">
        {arc(0, f1 - 0.004, "var(--down)")}{arc(f1, f2, "var(--muted)")}{arc(f2 + 0.004, 1, "var(--up)")}
        {N && <><line x1={cx} y1={cy} x2={N[0]} y2={N[1]} stroke="var(--text)" strokeWidth="3" strokeLinecap="round" /><circle cx={cx} cy={cy} r="6" fill="var(--text)" /></>}
        <text x={cx - R} y="170" textAnchor="middle" fontSize="11" fill="var(--muted)">Bearish</text>
        <text x={cx + R} y="170" textAnchor="middle" fontSize="11" fill="var(--muted)">Bullish</text>
      </svg>
      <p className="text-xl font-semibold" aria-live="polite">{r ? r.label : "—"}</p>
      <p className="note">{r ? `Overall put/call ${pcr!.toFixed(2)}` : "Awaiting feed. Source to be confirmed."}</p>
    </div>
  );
}

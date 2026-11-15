"use client";
import { useId, useState, type ReactNode } from "react";

/** "Try it" exercises for each lesson. Everything is worked out in the browser from the numbers you set. The starting numbers are
 *  invented for teaching and are not market data. */
const f = (v: number, d = 2) => v.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

function Slider({ label, value, min, max, step, onChange, fmt }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; fmt: (v: number) => string }) {
  const id = useId();
  return (
    <div className="lab-row">
      <label htmlFor={id}>{label}</label>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} />
      <output htmlFor={id} className="font-mono">{fmt(value)}</output>
    </div>
  );
}
const Shell = ({ title, lead, children }: { title: string; lead: string; children: ReactNode }) => (
  <section className="card lab" aria-label={`Try it: ${title}`}>
    <div className="eyebrow">Try it</div>
    <h2 style={{ fontSize: 22, margin: "6px 0 4px" }}>{title}</h2>
    <p className="expl" style={{ marginTop: 0 }}>{lead}</p>
    {children}
  </section>
);
const Stat = ({ k, v, tone }: { k: string; v: string; tone?: "up" | "down" }) => (
  <div className="lab-stat"><span>{k}</span><b className={`font-mono ${tone === "up" ? "text-upt" : tone === "down" ? "text-downt" : ""}`}>{v}</b></div>
);

/* 1. Time value of money: grow it forward, or discount it back. */
function CompoundLab() {
  const [mode, setMode] = useState<"fv" | "pv">("fv");
  const [amt, setAmt] = useState(1000), [r, setR] = useState(4), [n, setN] = useState(10);
  const g = 1 + r / 100, end = mode === "fv" ? amt * g ** n : amt / g ** n;
  const pts = Array.from({ length: n + 1 }, (_, y) => (mode === "fv" ? amt * g ** y : amt / g ** (n - y)));
  const top = Math.max(...pts, 1);
  const W = 320, H = 120, bw = W / (n + 1);
  return (
    <Shell title="Compounding and discounting" lead="Move the sliders and watch money grow forward, or switch to see what a future amount is worth today.">
      <div role="group" aria-label="Direction" className="lab-tabs">
        <button type="button" className="chip" aria-pressed={mode === "fv"} onClick={() => setMode("fv")}>Grow it forward</button>
        <button type="button" className="chip" aria-pressed={mode === "pv"} onClick={() => setMode("pv")}>Discount it back</button>
      </div>
      <Slider label={mode === "fv" ? "Invest today" : "Promised in the future"} value={amt} min={100} max={10000} step={100} onChange={setAmt} fmt={(v) => f(v, 0)} />
      <Slider label={mode === "fv" ? "Yearly return" : "Discount rate"} value={r} min={0} max={12} step={0.5} onChange={setR} fmt={(v) => `${f(v, 1)}%`} />
      <Slider label="Years" value={n} min={1} max={30} step={1} onChange={setN} fmt={(v) => String(v)} />
      <svg viewBox={`0 0 ${W} ${H}`} className="lab-svg" role="img" aria-label={mode === "fv" ? "Bars showing the amount at the end of each year" : "Bars showing the value today of the amount at each year"}>
        {pts.map((v, i) => { const h = Math.max(2, (v / top) * (H - 6)); return <rect key={i} x={i * bw + 1} y={H - h} width={Math.max(1, bw - 2)} height={h} rx={2} fill="var(--accent)" opacity={i === (mode === "fv" ? n : 0) ? 1 : 0.45} />; })}
      </svg>
      <div aria-live="polite" className="lab-stats">
        {mode === "fv"
          ? <><Stat k={`After ${n} years`} v={f(end)} /><Stat k="Of which interest" v={f(end - amt)} tone="up" /></>
          : <><Stat k="Worth today" v={f(end)} /><Stat k="Lost to waiting" v={f(amt - end)} tone="down" /></>}
      </div>
      <p className="note">{mode === "fv" ? "Future value = PV × (1 + r)^n. Try 0%: money alone does not grow." : "Present value = FV ÷ (1 + r)^n. Raise the rate or the years: the amount today shrinks."}</p>
    </Shell>
  );
}

/* 2. Returns and risk: the fall-then-rise trap, and what mixing two assets does to risk. */
function RiskLab() {
  const [s, setS] = useState(20), [w, setW] = useState(60), [rho, setRho] = useState(20);
  const after = 100 * (1 - s / 100) * (1 + s / 100);
  const ws = w / 100, sS = 16, sB = 5, mS = 8, mB = 4, c = rho / 100;
  const vol = Math.sqrt(ws * ws * sS * sS + (1 - ws) ** 2 * sB * sB + 2 * ws * (1 - ws) * c * sS * sB);
  const exp = ws * mS + (1 - ws) * mB, avgVol = ws * sS + (1 - ws) * sB;
  return (
    <Shell title="Swings and mixing" lead="First see why a fall then an equal rise does not get you back. Then mix two made-up assets and watch risk.">
      <h3 className="lab-h">1. Fall, then rise by the same percentage</h3>
      <Slider label="Size of the swing" value={s} min={0} max={50} step={1} onChange={setS} fmt={(v) => `${v}%`} />
      <div aria-live="polite" className="lab-stats"><Stat k="Start" v="100.00" /><Stat k={`Down ${s}% then up ${s}%`} v={f(after)} tone={after < 100 ? "down" : undefined} /><Stat k="Left behind" v={f(100 - after)} tone={after < 100 ? "down" : undefined} /></div>
      <h3 className="lab-h">2. A shares-and-bonds mix (invented numbers)</h3>
      <Slider label="Share in the risky asset" value={w} min={0} max={100} step={5} onChange={setW} fmt={(v) => `${v}%`} />
      <Slider label="How alike the two move" value={rho} min={-50} max={100} step={10} onChange={setRho} fmt={(v) => `${v >= 0 ? "" : "−"}${f(Math.abs(v) / 100, 1)}`} />
      <div aria-live="polite" className="lab-stats"><Stat k="Expected return" v={`${f(exp)}%`} /><Stat k="Risk of the mix" v={`${f(vol)}%`} /><Stat k="Plain average of the two risks" v={`${f(avgVol)}%`} /></div>
      <p className="note">Risky asset: 8% expected return, 16% risk. Calmer asset: 4% and 5%. Unless the two move perfectly together (1.0), the mix has less risk than the plain average. That gap is the benefit of diversifying.</p>
    </Shell>
  );
}

/* 3. Bond pricing: price from yield, maturity and coupon, and the see-saw. */
const price = (coupon: number, y: number, n: number) => { let p = 0; for (let t = 1; t <= n; t++) p += coupon / (1 + y) ** t; return p + 100 / (1 + y) ** n; };
function BondLab() {
  const [y, setY] = useState(6), [n, setN] = useState(2), [cp, setCp] = useState(5);
  const p = price(cp, y / 100, n);
  const W = 320, H = 130, X = (v: number) => ((v - 1) / 11) * (W - 20) + 10;
  const lo = price(cp, 0.12, n), hi = price(cp, 0.01, n), Y = (v: number) => H - 10 - ((v - lo) / (hi - lo)) * (H - 20);
  const path = Array.from({ length: 56 }, (_, i) => { const yy = 1 + (11 * i) / 55; return `${i ? "L" : "M"}${X(yy).toFixed(1)} ${Y(price(cp, yy / 100, n)).toFixed(1)}`; }).join(" ");
  return (
    <Shell title="The bond see-saw" lead="A bond with face value 100 and a yearly coupon. Move the market yield and see the price react.">
      <Slider label="Market yield" value={y} min={1} max={12} step={0.25} onChange={setY} fmt={(v) => `${f(v)}%`} />
      <Slider label="Years to maturity" value={n} min={1} max={30} step={1} onChange={setN} fmt={(v) => String(v)} />
      <Slider label="Coupon" value={cp} min={1} max={10} step={0.5} onChange={setCp} fmt={(v) => `${f(v, 1)}%`} />
      <svg viewBox={`0 0 ${W} ${H}`} className="lab-svg" role="img" aria-label="Price of the bond at different yields. The price falls as the yield rises.">
        <path d={path} fill="none" stroke="var(--muted)" strokeWidth={2} />
        <circle cx={X(y)} cy={Y(p)} r={6} fill="var(--accent)" />
      </svg>
      <div aria-live="polite" className="lab-stats">
        <Stat k="Price" v={f(p)} tone={p > 100 ? "up" : p < 100 ? "down" : undefined} /><Stat k="vs face value (100)" v={`${p >= 100 ? "+" : "−"}${f(Math.abs(p - 100))}`} tone={p > 100 ? "up" : p < 100 ? "down" : undefined} />
        <Stat k="Status" v={Math.abs(y - cp) < 0.01 ? "At par" : y > cp ? "Discount" : "Premium"} />
      </div>
      <p className="note">Yield equal to the coupon gives 100. Yield above the coupon: the bond sells at a discount. Now raise the years: the same yield move changes the price more. That is duration.</p>
    </Shell>
  );
}

/* 4. Yield curve: set the 2-year and 10-year yields, read the shape and the 2s10s spread. */
function CurveLab() {
  const [a, setA] = useState(4.2), [b, setB] = useState(4.5);
  const spread = b - a, shape = Math.abs(spread) < 0.1 ? "Flat" : spread > 0 ? "Normal" : "Inverted";
  const mats = [2, 5, 10, 30], ys = [a, a + (b - a) * 0.55, b, b + (b - a) * 0.15];
  const W = 320, H = 130, lo = 0, hi = 8, X = (m: number) => 14 + ((m - 2) / 28) * (W - 28), Y = (v: number) => H - 14 - ((v - lo) / (hi - lo)) * (H - 28);
  return (
    <Shell title="Build a yield curve" lead="Set the 2-year and 10-year yields (made-up starting values). The curve and its label follow.">
      <Slider label="2-year yield" value={a} min={0.5} max={7} step={0.05} onChange={setA} fmt={(v) => `${f(v)}%`} />
      <Slider label="10-year yield" value={b} min={0.5} max={7} step={0.05} onChange={setB} fmt={(v) => `${f(v)}%`} />
      <svg viewBox={`0 0 ${W} ${H}`} className="lab-svg" role="img" aria-label={`${shape} yield curve through the 2, 5, 10 and 30 year yields`}>
        <polyline points={mats.map((m, i) => `${X(m)},${Y(ys[i])}`).join(" ")} fill="none" stroke="var(--accent)" strokeWidth={2.5} />
        {mats.map((m, i) => <g key={m}><circle cx={X(m)} cy={Y(ys[i])} r={4} fill="var(--accent)" /><text x={X(m)} y={H - 1} textAnchor="middle" fontSize="9" fill="var(--muted)">{m}Y</text></g>)}
      </svg>
      <div aria-live="polite" className="lab-stats"><Stat k="Shape" v={shape} tone={shape === "Inverted" ? "down" : undefined} /><Stat k="2s10s spread" v={`${spread >= 0 ? "+" : "−"}${f(Math.abs(spread))} pp`} tone={shape === "Inverted" ? "down" : spread > 0.1 ? "up" : undefined} /></div>
      <p className="note">Spread = 10-year yield minus 2-year yield, in percentage points. Drag the 2-year above the 10-year to invert the curve. The 5-year and 30-year points are only drawn to show the shape.</p>
    </Shell>
  );
}

export default function LessonLab({ slug }: { slug: string }) {
  switch (slug) {
    case "time-value-of-money": return <CompoundLab />;
    case "returns-and-risk": return <RiskLab />;
    case "bond-pricing-basics": return <BondLab />;
    case "reading-a-yield-curve": return <CurveLab />;
    default: return null;
  }
}

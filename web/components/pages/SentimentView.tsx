"use client";
import { useMemo, useState } from "react";
import { toast } from "@/components/Toaster";

export type Row = { t: string; s: string; price: number | null; chg: number | null };
const sign = (v: number) => `${v > 0 ? "▲ +" : v < 0 ? "▼ " : "■ "}${v.toFixed(2)}%`;
const tone = (v: number | null) => (v == null ? "" : v > 0 ? "text-upt" : v < 0 ? "text-downt" : "");
const FREE = 5;

/** Sentiment page. The AI engine is not connected, so no score is ever shown. Live price and change come from Finnhub. */
export default function SentimentView({ rows }: { rows: Row[] }) {
  const [list, setList] = useState<Row[]>(rows);
  const [last, setLast] = useState<string | null>(null);
  const [hl, setHl] = useState<string | null>(null);
  const [sort, setSort] = useState<"ticker" | "sector">("ticker");
  const [sec, setSec] = useState(0);
  const [q, setQ] = useState("");
  const sectors = useMemo(() => ["All sectors", ...[...new Set(list.map((r) => r.s).filter((s) => s !== "—"))].sort()], [list]);
  const cur = sectors[sec] ?? "All sectors";
  const shown = [...list.filter((r) => sec === 0 || r.s === cur)].sort((a, b) => (sort === "ticker" ? a.t.localeCompare(b.t) : a.s.localeCompare(b.s) || a.t.localeCompare(b.t)));

  const run = (t: string) => { setLast(t); toast(`Preview: the sentiment engine is not connected yet, so ${t} has no score. Your free reports are unchanged.`); };
  const ask = () => {
    const v = q.trim().toUpperCase();
    if (!/^[A-Z][A-Z.\-]{0,5}$/.test(v)) { toast("Enter a ticker of 1 to 6 letters, for example AAPL."); return; }
    if (!list.some((r) => r.t === v)) setList([{ t: v, s: "—", price: null, chg: null }, ...list]);
    setHl(v); setSec(0); setQ(""); run(v);
  };

  return (
    <div className="wrap pg"><div className="split">
      <div className="sticky">
        <div className="eyebrow">Sentiment</div>
        <h1 className="two fx" style={{ margin: "12px 0 14px" }}>Read the mood. <span className="dim">Check the numbers.</span></h1>
        <p className="lede">A report pairs recent headlines with core fundamentals. The AI reads only what we pass to it and may not add outside figures.</p>
        <form className="search" onSubmit={(e) => { e.preventDefault(); ask(); }}>
          <label className="sr" htmlFor="ticker">Ticker</label>
          <input id="ticker" type="text" autoComplete="off" spellCheck={false} placeholder="Search a ticker, for example AAPL" value={q} onChange={(e) => setQ(e.target.value)} />
          <button className="b solid" type="submit">Run report</button>
        </form>
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 12 }}>
          <span className="pips" aria-label={`${FREE} of ${FREE} free reports left`}>{Array.from({ length: FREE }, (_, i) => <i key={i} />)} <span style={{ marginLeft: 4 }}>{FREE} / {FREE}</span></span>
          <span className="note" style={{ margin: 0 }}>free reports left</span>
        </div>
        <div className="report" aria-live="polite">
          <div className="top"><div><div style={{ fontSize: 11, color: "var(--muted)" }}>{last ? "Report" : "Report preview"}</div><div style={{ fontSize: 26, fontWeight: 700 }}>{last ?? "Ticker"}</div></div><span className={`tag ${last ? "closed" : "ai"}`}>{last ? "Awaiting engine" : "AI"}</span></div>
          <div className="score">—<small> / 100</small></div>
          <div className="rep-sec"><b>Label</b><span>Bullish, Neutral or Bearish once scored</span></div>
          <div className="rep-sec"><b>Catalysts</b><span>From the latest headlines</span></div>
          <div className="rep-sec"><b>Risks</b><span>From the latest headlines</span></div>
          <div className="rep-sec"><b>Fundamentals summary</b><span>Uses only the numbers passed in: P/E, EBITDA, market cap, debt to equity, ROE</span></div>
        </div>
      </div>
      <div>
        <h2 className="rv" style={{ fontSize: 13, fontWeight: 500, color: "var(--muted)", marginBottom: 10, letterSpacing: 0 }}>How a report is built</h2>
        <ol className="steps rv" style={{ listStyle: "none", padding: 0 }}>
          <li className="step"><span className="n">1</span><div><b>Check your free quota</b><p>The server confirms you still have one of five free reports, or an active plan.</p></div></li>
          <li className="step"><span className="n">2</span><div><b>Fetch fundamentals</b><p>P/E, EBITDA, market cap, debt to equity and ROE from FMP, cached and dated.</p></div></li>
          <li className="step"><span className="n">3</span><div><b>Read the latest headlines</b><p>The newest five to ten stories on the ticker from Finnhub.</p></div></li>
          <li className="step"><span className="n">4</span><div><b>Score with Claude Haiku</b><p>Strict JSON: a 0 to 100 score, a label, catalysts, risks and a fundamentals summary.</p></div></li>
        </ol>
        <h2 className="rv" style={{ fontSize: 13, fontWeight: 500, color: "var(--muted)", margin: "6px 0 10px", letterSpacing: 0 }}>Watchlist</h2>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
          <button type="button" className="chip" onClick={() => setSort(sort === "ticker" ? "sector" : "ticker")}>Sorted by {sort}</button>
          <button type="button" className="chip" onClick={() => setSec((sec + 1) % sectors.length)}>{cur}</button>
        </div>
        <div className="tablewrap rv"><table>
          <caption className="sr">Watchlist with live price and daily change</caption>
          <thead><tr><th scope="col">Ticker</th><th scope="col">Sector</th><th scope="col">Price and change</th><th scope="col">Sentiment <span className="tag ai">AI</span></th></tr></thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.t} className={hl === r.t ? "hl" : ""}>
                <th scope="row" style={{ fontWeight: 500 }}><span className="logo">{r.t[0]}</span>{r.t}</th>
                <td><span className="sect">{r.s}</span></td>
                <td className="font-mono tabular-nums">{r.price == null ? <span className="text-muted">—</span> : <>{r.price.toFixed(2)} <span className={tone(r.chg)}>{r.chg == null ? "" : sign(r.chg)}</span></>}</td>
                <td><button type="button" className="run" onClick={() => run(r.t)}>Run report</button></td>
              </tr>
            ))}
          </tbody>
        </table></div>
        <p className="note" style={{ marginTop: 10 }}>Prices in US dollars from Finnhub, cached for 10 minutes. P/E and EBITDA arrive with the sentiment engine. Educational information only, not advice.</p>
      </div>
    </div></div>
  );
}

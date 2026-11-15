"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Item } from "@/lib/markets-view";
import { PERIODS, type Bar, type Kind, type PeriodKey } from "@/lib/periods";
import { parBondMeasures, maturityYears } from "@/lib/bondmath";
import { BOND_GROUPS, RANGE_GROUPS, STOCK_GROUPS, fmtMetric, type Group } from "@/components/markets/fundamentals-config";
import CandleChart, { fdate } from "@/components/markets/CandleChart";
import TradingViewChart from "@/components/markets/TradingViewChart";
import { tvSymbol } from "@/lib/tvsymbols";

export type Selection = { item: Item; kind: Kind; period?: PeriodKey };
const KIND_NAME: Record<Kind, string> = { stock: "Stock", bond: "Bond yield", index: "Index", fx: "Currency pair", commodity: "Commodity" };
const DAY = 86_400_000;
/** Remembered for the visit, so the visitor is asked once before any third-party chart loads. */
let tvAllowed = false;

/** Range statistics from real daily history (5 years of bars). */
function rangeStats(daily: Bar[]) {
  const last = daily[daily.length - 1], hi = (b: Bar) => b[2] ?? b[4], lo = (b: Bar) => b[3] ?? b[4];
  const yr = daily.filter((b) => b[0] >= last[0] - 366 * DAY), yStart = Date.UTC(new Date(last[0]).getUTCFullYear(), 0, 1);
  const ref = (cut: number) => { let r: Bar | null = null; for (const b of daily) { if (b[0] <= cut) r = b; else break; } return r; };
  const pct = (r: Bar | null) => (r && r[4] ? (last[4] / r[4] - 1) * 100 : null);
  const d = new Date(last[0]); const back = (y: number) => Date.UTC(d.getUTCFullYear() - y, d.getUTCMonth(), d.getUTCDate());
  return {
    last: last[4], dayhi: hi(last), daylo: lo(last), hi52: Math.max(...yr.map(hi)), lo52: Math.min(...yr.map(lo)),
    ytd: pct(ref(yStart - 1)), y1: pct(ref(back(1))), y5: daily[0][0] <= back(5) + 14 * DAY ? pct(daily[0]) : null,
  };
}

export default function InstrumentDialog({ sel, yields, onClose }: { sel: Selection | null; yields: Item[]; onClose: () => void }) {
  const [period, setPeriod] = useState<PeriodKey>("1M");
  const [type, setType] = useState<"candle" | "line">("candle");
  const [tvOn, setTvOn] = useState(false), [tvMode, setTvMode] = useState(false);
  const [view, setView] = useState<[number, number]>([0, 1]);
  const [bars, setBars] = useState<Record<string, { bars: Bar[]; note?: string } | "loading">>({});
  const [fund, setFund] = useState<Record<string, number | string | null> | null | "loading">("loading");
  const closeRef = useRef<HTMLButtonElement>(null), opener = useRef<Element | null>(null);
  const symbol = sel?.item.symbol ?? "";
  const kind = sel?.kind;
  const decimals = kind === "fx" ? 4 : 2;

  const requested = useRef(new Set<string>());
  const load = useCallback((p: PeriodKey) => {
    if (!symbol) return;
    const key = `${symbol}:${p}`;
    if (requested.current.has(key)) return;
    requested.current.add(key);
    setBars((s) => (s[key] ? s : { ...s, [key]: "loading" }));
    fetch(`/api/candles?symbol=${encodeURIComponent(symbol)}&period=${p}`).then((r) => r.json())
      .then((j) => setBars((s) => ({ ...s, [key]: { bars: Array.isArray(j.bars) ? j.bars : [], note: j.note } })))
      .catch(() => setBars((s) => ({ ...s, [key]: { bars: [], note: "No data available for this period right now." } })));
  }, [symbol]);

  // open: remember focus, lock scroll, reset view, start loading
  useEffect(() => {
    if (!sel) return;
    opener.current = document.activeElement; document.body.style.overflow = "hidden";
    requested.current = new Set(); setPeriod(sel.kind === "bond" && (sel.period === "1D" || sel.period === "1W" || !sel.period) ? "1M" : sel.period ?? "1M"); setTvMode(false); setTvOn(tvAllowed); setType("candle"); setView([0, 1]); setBars({}); setFund("loading");
    closeRef.current?.focus();
    return () => { document.body.style.overflow = ""; (opener.current as HTMLElement | null)?.focus?.(); };
  }, [sel]);
  useEffect(() => { if (symbol) { load(period); if (kind !== "stock" && kind !== "bond") load("5Y"); } }, [symbol, period, kind, load]);
  useEffect(() => {
    if (!symbol || kind !== "stock") return;
    let alive = true;
    fetch(`/api/fundamentals?symbol=${encodeURIComponent(symbol)}`).then((r) => r.json()).then((j) => alive && setFund(j.fund ?? null)).catch(() => alive && setFund(null));
    return () => { alive = false; };
  }, [symbol, kind]);
  useEffect(() => {
    if (!sel) return;
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    addEventListener("keydown", k); return () => removeEventListener("keydown", k);
  }, [sel, onClose]);

  const cur = bars[`${symbol}:${period}`];
  const data = cur && cur !== "loading" ? cur : null;
  const list = data?.bars ?? [];
  const intraday = period === "1D" || period === "1W";
  const first = list[0], last = list[list.length - 1];
  const tvSym = tvSymbol(symbol, kind ?? "");
  const noOwn = !!cur && cur !== "loading" && list.length < 2;
  const showTv = !!tvSym && (tvMode || (noOwn && intraday));
  const live = sel ? (kind === "bond" ? sel.item.value : sel.item.price) : null;
  const change = first && last ? (kind === "bond" ? (last[4] - first[4]) * 100 : (last[4] / (first[1] ?? first[4]) - 1) * 100) : null;

  const groups: { title: string; rows: [string, string, string, string][] }[] = useMemo(() => {
    if (!sel) return [];
    const toRows = (gs: Group[], v: Record<string, number | string | null>, dec = 2) => gs.map(([title, ms]) => ({ title, rows: ms.map(([k, l, f, how]) => [l, how, fmtMetric(f, v[k] as number | string | null, dec), k] as [string, string, string, string]) }));
    if (sel.kind === "stock") return fund && fund !== "loading" ? toRows(STOCK_GROUPS, fund) : [];
    if (sel.kind === "bond") {
      const y = sel.item.value, yrs = maturityYears(sel.item.label), out = [];
      const u2 = yields.find((i) => i.symbol === "DGS2")?.value, u10 = yields.find((i) => i.symbol === "DGS10")?.value;
      if (sel.item.symbol?.startsWith("DGS") && u2 != null && u10 != null) out.push({ title: "Curve", rows: [["US 10-year minus 2-year", "10-year yield − 2-year yield", fmtMetric("bp", (u10 - u2) * 100), "2s10s"] as [string, string, string, string]] });
      if (y != null && yrs) out.push(...toRows(BOND_GROUPS, parBondMeasures(y, yrs)));
      return out;
    }
    const d5 = bars[`${symbol}:5Y`];
    return d5 && d5 !== "loading" && d5.bars.length ? toRows(RANGE_GROUPS, rangeStats(d5.bars), decimals) : [];
  }, [sel, fund, yields, bars, symbol, decimals]);

  if (!sel) return null;
  const note = sel.kind === "stock" ? "Ratios are trailing twelve months where available. A dash means the data provider did not return that figure." : sel.kind === "bond" ? "Duration and convexity are calculated for a par bond (coupon equal to the yield, semi-annual coupons) at today’s yield. They are model figures, not quotes." : "Range and performance are worked out from daily history.";
  return (
    <div className="dg-ov" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="dg" role="dialog" aria-modal="true" aria-labelledby="dg-title">
        <div className="dg-h">
          <div><div className="dg-kind">{KIND_NAME[sel.kind]}</div><h2 id="dg-title">{sel.item.label}</h2></div>
          <button ref={closeRef} type="button" className="dg-x" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="dg-tools">
          <div className="dg-seg" role="group" aria-label="Chart period">
            {PERIODS.filter(([k]) => kind !== "bond" || (k !== "1D" && k !== "1W")).map(([k, name]) => <button key={k} type="button" aria-pressed={period === k} aria-label={name} onClick={() => { setPeriod(k); setView([0, 1]); }}>{k}</button>)}
          </div>
          <div className="dg-seg" role="group" aria-label="Chart type">
            <button type="button" aria-pressed={type === "candle"} onClick={() => setType("candle")}>Candles</button>
            <button type="button" aria-pressed={type === "line"} onClick={() => setType("line")}>Line</button>
          </div>
        </div>
        <div className="dg-chg">
          <span className="font-mono dg-last">{last ? (kind === "bond" ? `${last[4].toFixed(2)}%` : last[4].toFixed(decimals)) : live != null ? (kind === "bond" ? `${live.toFixed(2)}%` : live.toFixed(decimals)) : "—"}</span>
          {change != null && <span className={`font-mono ${change >= 0 ? "text-upt" : "text-downt"}`}>{change >= 0 ? "▲ +" : "▼ "}{kind === "bond" ? `${change.toFixed(0)} bp` : `${change.toFixed(2)}%`}</span>}
          {change != null && <span className="note">over {PERIODS.find(([k]) => k === period)![1]}</span>}
          {!last && live != null && <span className="note">latest quote</span>}
        </div>
        {showTv ? (
          tvOn ? <TradingViewChart symbol={tvSym!} period={period} label={sel.item.label} />
          : <div className="tv-gate" role="group" aria-label="Interactive chart">
              <p>{noOwn && intraday ? "Intraday candles for this period come from TradingView’s free chart." : "Open TradingView’s interactive chart."} It loads content from tradingview.com, which may set its own cookies.</p>
              <button type="button" className="tv-btn" onClick={() => { tvAllowed = true; setTvOn(true); }}>Load interactive chart</button>
            </div>
        ) : cur === "loading" || !cur ? <div className="dg-empty" role="status">Loading chart…</div>
          : list.length < 2 ? <div className="dg-empty" role="status">{data?.note ?? "No data available for this period right now."}</div>
          : <CandleChart bars={list} type={type} decimals={decimals} intraday={intraday} view={view} onView={(a, b) => setView([a, b])} />}
        {tvSym && !(noOwn && intraday) && <p className="note dg-foot"><button type="button" className="tv-link" onClick={() => setTvMode((m) => !m)}>{tvMode ? "Back to our chart" : "Open interactive chart (TradingView)"}</button></p>}
        {last && !showTv && <p className="note dg-foot">Last data point: {fdate(last[0], intraday)}{intraday ? " (exchange time)" : ""}. Scroll to zoom, drag to pan.</p>}

        <h3 className="dg-fh">Fundamentals</h3>
        {fund === "loading" && sel.kind === "stock" ? <p className="note" role="status">Loading fundamentals…</p>
          : groups.length === 0 ? <p className="note">Fundamentals are not available for this instrument right now.</p>
          : <><p className="note">{note}{sel.kind === "stock" && fund && fund !== "loading" && typeof fund.asof === "string" ? ` ${fund.asof}.` : ""}</p>
            <div className="dg-fgrid">{groups.map((g) => (
              <section key={g.title} className="dg-fgroup"><h4>{g.title}</h4>
                {g.rows.map(([l, how, v], i) => <div key={l + i} className="dg-frow"><div><div className="dg-fl">{l}</div><div className="dg-fhow">{how}</div></div><div className={`font-mono dg-fv ${v === "—" ? "na" : ""}`}>{v}</div></div>)}
              </section>))}</div></>}
        <p className="note" style={{ marginTop: 14 }}>For education only, not financial advice. Nothing here is estimated: a dash means the data is not available.</p>
      </div>
    </div>
  );
}

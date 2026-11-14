"use client";
import { useRef, useState } from "react";
import type { MarketsData } from "@/lib/markets-view";
import { HUBS } from "@/lib/hubs";
import Bars from "@/components/markets/Bars";
import StrengthGrid from "@/components/markets/Strength";
import OptionsGauge from "@/components/markets/OptionsGauge";
import Heat from "@/components/markets/Heat";
import Sessions from "@/components/markets/Sessions";

const TABS = [["overview", "Overview"], ["bonds", "Bonds"], ["indices", "Indices"], ["currencies", "Currencies"], ["stocks", "Stocks"], ["options", "Options"], ["heatmap", "Heatmap"], ["sessions", "Sessions"]] as const;
type Tab = (typeof TABS)[number][0];
const STOCKS = [["AAPL", "Technology"], ["MSFT", "Technology"], ["NVDA", "Technology"], ["AMZN", "Consumer Discretionary"], ["TSLA", "Consumer Discretionary"], ["JPM", "Financials"], ["XOM", "Energy"], ["JNJ", "Health Care"]];

function Panel({ title, sub, source, children }: { title: string; sub?: string; source: string; children: React.ReactNode }) {
  return (
    <section className="card">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div><h2 className="text-sm font-semibold">{title}</h2>{sub && <p className="note mt-0.5">{sub}</p>}</div>
        <span className="rounded bg-surface2 px-2 py-0.5 font-mono text-[11px] text-muted">{source}</span>
      </div>
      {children}
    </section>
  );
}

export default function MarketsTabs({ data }: { data: MarketsData }) {
  const [tab, setTab] = useState<Tab>("overview");
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  const onKey = (e: React.KeyboardEvent, i: number) => {
    const k = e.key; if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(k)) return;
    e.preventDefault();
    const j = k === "Home" ? 0 : k === "End" ? TABS.length - 1 : (i + (k === "ArrowRight" ? 1 : -1) + TABS.length) % TABS.length;
    setTab(TABS[j][0]); refs.current[TABS[j][0]]?.focus();
  };

  const bonds = <Panel title="Bonds and volatility" sub="Government yields in percent" source="FRED"><Bars items={[...data.yields, ...(data.vix ? [{ ...data.vix, group: "Volatility" }] : [])]} mode="yield" /></Panel>;
  const indices = <Panel title="Indices" sub="Daily change of benchmark indices, by region" source="FMP"><Bars items={data.indices} mode="chg" /></Panel>;
  const fx = <Panel title="Currencies" sub="Daily change of the main pairs" source="FMP"><Bars items={data.fx} mode="chg" decimals={4} /></Panel>;
  const strength = <Panel title="Currency strength" sub="The most traded currencies against the US dollar" source="FMP"><StrengthGrid data={data.strength} /></Panel>;

  return (
    <div>
      <div role="tablist" aria-label="Markets sections" className="mt-8 flex gap-1 overflow-x-auto border-b border-line pb-px">
        {TABS.map(([id, name], i) => (
          <button
            key={id} id={`tab-${id}`} role="tab" type="button" ref={(el) => { refs.current[id] = el; }}
            aria-selected={tab === id} aria-controls={`panel-${id}`} tabIndex={tab === id ? 0 : -1}
            onClick={() => setTab(id)} onKeyDown={(e) => onKey(e, i)}
            className={`whitespace-nowrap rounded-t-md px-3.5 py-2.5 text-sm font-semibold ${tab === id ? "border-b-2 border-accent text-text" : "text-muted hover:text-text"}`}
          >{name}</button>
        ))}
      </div>
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} tabIndex={0} className="mt-6 outline-offset-4">
        {tab === "overview" && <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{bonds}{indices}{fx}{strength}</div>}
        {tab === "bonds" && (
          <div className="space-y-5">{bonds}
            <div className="card overflow-x-auto">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">Government bond yields by instrument</caption>
                <thead><tr className="text-xs text-muted"><th scope="col" className="py-2 pr-4 font-medium">Instrument</th><th scope="col" className="pr-4 font-medium">Source</th><th scope="col" className="pr-4 font-medium">Yield</th><th scope="col" className="font-medium">Last updated</th></tr></thead>
                <tbody className="divide-y divide-line">
                  {data.yields.map((y) => (<tr key={y.label}><th scope="row" className="py-2 pr-4 font-normal">{y.label}</th><td className="pr-4 font-mono text-xs text-muted">FRED</td><td className="pr-4 font-mono tabular-nums">{y.value == null ? "—" : `${y.value.toFixed(2)}%`}</td><td className="font-mono text-xs text-muted">{y.date ?? y.reason ?? "—"}</td></tr>))}
                  {HUBS.filter((h) => h.id !== "nyc" && h.bsrc).map((h) => (<tr key={h.id}><th scope="row" className="py-2 pr-4 font-normal">{h.bond}</th><td className="pr-4 font-mono text-xs text-muted">{h.bsrc}</td><td className="pr-4 font-mono">—</td><td className="text-xs text-muted">Awaiting feed</td></tr>))}
                </tbody>
              </table>
            </div>
            <p className="note">Yields show two decimals. FRED values are about one day behind. Other countries need a data source that is not connected yet.</p>
          </div>
        )}
        {tab === "indices" && <div className="space-y-5">{indices}<p className="note">A few indices need a paid data plan and show as unavailable instead of an estimate.</p></div>}
        {tab === "currencies" && <div className="space-y-5">{strength}{fx}</div>}
        {tab === "stocks" && (
          <Panel title="Stocks" sub="The tickers in Sentiment, grouped by sector" source="FMP · Finnhub">
            <ul>{STOCKS.map(([t, s]) => (<li key={t} className="flex items-center justify-between py-1.5 text-sm"><span><b className="font-mono">{t}</b> <span className="text-xs text-muted">{s}</span></span><span className="text-xs text-muted">Awaiting feed</span></li>))}</ul>
            <p className="note mt-3">Stock quotes arrive with the Sentiment engine. Nothing is estimated until then.</p>
          </Panel>
        )}
        {tab === "options" && (
          <div className="space-y-5">
            <Panel title="Options" sub="Bullish or bearish, from the put/call ratio" source="Source to be confirmed"><OptionsGauge pcr={null} /></Panel>
            <section className="card">
              <h2 className="text-sm font-semibold">Why options matter</h2>
              <p className="note mt-2 text-[13.5px]">Options show what traders pay to protect against a fall or to bet on a rise. That positioning often moves before prices do, and most retail screens leave it out.</p>
              <p className="note mt-2 text-[13.5px]">The gauge uses the put/call ratio. Below 0.70 reads bullish, above 1.00 bearish, and in between neutral. These cut-offs are a simple convention, and extreme readings are sometimes read the other way. Treat it as context, not a forecast.</p>
            </section>
          </div>
        )}
        {tab === "heatmap" && <Panel title="Heatmap" sub="Indices by region, daily move" source="FMP"><Heat items={data.indices} /></Panel>}
        {tab === "sessions" && <Sessions />}
      </div>
    </div>
  );
}

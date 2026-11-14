"use client";
import { useRef, useState } from "react";
import type { MarketsData } from "@/lib/markets-view";
import Bars from "@/components/markets/Bars";
import StrengthGrid from "@/components/markets/Strength";
import OptionsGauge, { type OptionsData } from "@/components/markets/OptionsGauge";
import Heat from "@/components/markets/Heat";
import Sessions from "@/components/markets/Sessions";

const TABS = [["overview", "Overview"], ["bonds", "Bonds"], ["indices", "Indices"], ["currencies", "Currencies"], ["commodities", "Commodities"], ["stocks", "Stocks"], ["options", "Options"], ["heatmap", "Heatmap"], ["sessions", "Sessions"]] as const;
type Tab = (typeof TABS)[number][0];
const NO_OPTIONS: OptionsData = { overall: null };

function Empty({ children }: { children: React.ReactNode }) { return <p className="note py-2">{children}</p>; }

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

  const vix = data.vix;
  const bonds = (
    <Panel title="Bonds" sub="Government yields in percent: US Treasuries first, then 10-year by region" source="FRED · FMP">
      {data.yields.length ? <Bars items={data.yields} mode="yield" /> : <Empty>Yields are unavailable right now.</Empty>}
      {vix && (
        <p className="mt-3 flex items-baseline justify-between border-t border-line pt-3 text-sm">
          <span>VIX volatility index{vix.saved && <span className="ml-1 rounded bg-surface2 px-1.5 py-0.5 text-[10px] text-muted">Saved value</span>}</span>
          {vix.value == null ? <span className="text-xs text-muted">{vix.reason}</span> : <span className="font-mono tabular-nums">{vix.value.toFixed(2)}<span className="ml-1 text-xs text-muted">{vix.date}</span></span>}
        </p>
      )}
    </Panel>
  );
  const indices = <Panel title="Indices" sub="Daily change of benchmark indices, by region" source="FMP">{data.indices.length ? <Bars items={data.indices} mode="chg" /> : <Empty>Index data is unavailable right now.</Empty>}</Panel>;
  const commodities = <Panel title="Commodities" sub="Metals and energy, daily change in US dollars" source="FMP">{data.commodities.length ? <Bars items={data.commodities} mode="chg" decimals={2} /> : <Empty>Commodity prices are unavailable right now.</Empty>}</Panel>;
  const stocks = (
    <Panel title="Stocks" sub="The tickers in Sentiment, grouped by sector" source="Finnhub">
      {data.stocks.length ? <Bars items={data.stocks} mode="chg" /> : <Empty>Stock quotes are unavailable right now.</Empty>}
      <p className="note mt-3">Prices in US dollars. Quotes can be delayed.</p>
    </Panel>
  );
  const fx = <Panel title="Currencies" sub="Daily change of the main pairs, majors first" source="FMP">{data.fx.length ? <Bars items={data.fx} mode="chg" decimals={4} /> : <Empty>Currency data is unavailable right now.</Empty>}</Panel>;
  const strength = <Panel title="Currency strength" sub="The dollar and the most traded currencies, one by one" source="FMP">{data.strength.length ? <StrengthGrid data={data.strength} /> : <Empty>Currency strength is unavailable right now.</Empty>}</Panel>;
  const options = <Panel title="Options" sub="Bullish or bearish: overall and by market" source="Source to be confirmed"><OptionsGauge data={NO_OPTIONS} /></Panel>;

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
        {tab === "overview" && (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{bonds}{indices}{commodities}{stocks}{fx}{strength}<div className="md:col-span-2 xl:col-span-3">{options}</div></div>
        )}
        {tab === "bonds" && (
          <div className="space-y-5">{bonds}
            <div className="card overflow-x-auto">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">Government bond yields and VIX by instrument</caption>
                <thead><tr className="text-xs text-muted"><th scope="col" className="py-2 pr-4 font-medium">Instrument</th><th scope="col" className="pr-4 font-medium">Source</th><th scope="col" className="pr-4 font-medium">Yield</th><th scope="col" className="font-medium">Last updated</th></tr></thead>
                <tbody className="divide-y divide-line">
                  {[...data.yields, ...(vix ? [vix] : [])].map((y) => (
                    <tr key={y.label}><th scope="row" className="py-2 pr-4 font-normal">{y.label}</th><td className="pr-4 font-mono text-xs text-muted">{y.date !== undefined || y.group === "US Treasuries" || y.label.startsWith("VIX") ? "FRED" : "FMP"}</td><td className="pr-4 font-mono tabular-nums">{y.value == null ? "—" : y.label.startsWith("VIX") ? y.value.toFixed(2) : `${y.value.toFixed(2)}%`}</td><td className="font-mono text-xs text-muted">{y.date ?? y.reason ?? "—"}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="note">Yields show two decimals once the feed is connected. FRED data arrives with about one day of delay.</p>
          </div>
        )}
        {tab === "indices" && <div className="space-y-5">{indices}<p className="note">Only indices with live data are listed.</p></div>}
        {tab === "currencies" && <div className="space-y-5">{strength}{fx}</div>}
        {tab === "commodities" && <div className="space-y-5">{commodities}<p className="note">Gold, silver, platinum and copper are metals. Oil and gas are energy. Prices are futures-style benchmark quotes. Only instruments with live data are listed.</p></div>}
        {tab === "stocks" && stocks}
        {tab === "options" && (
          <div className="space-y-5">{options}
            <section className="card">
              <h2 className="text-sm font-semibold">Why options matter</h2>
              <p className="note mt-2 text-[13.5px]">Options show what traders pay to protect against a fall or to bet on a rise. That positioning often moves before prices do, and most retail screens leave it out.</p>
              <p className="note mt-2 text-[13.5px]">The gauge uses the put/call ratio. Below 0.70 reads bullish, above 1.00 bearish, and in between neutral. These cut-offs are a simple convention, and extreme readings are sometimes read the other way. Treat it as context, not a forecast.</p>
            </section>
          </div>
        )}
        {tab === "heatmap" && <Panel title="Heatmap" sub="Today’s moves at a glance. Swipe or use the arrows to change view." source="FMP · Finnhub"><Heat indices={data.indices} fx={data.fx} commodities={data.commodities} stocks={data.stocks} /></Panel>}
        {tab === "sessions" && <Sessions />}
      </div>
    </div>
  );
}

"use client";
import { useRef, useState, type ReactNode } from "react";
import type { Item, MarketsData } from "@/lib/markets-view";
import type { Kind } from "@/lib/periods";
import { PERIODS } from "@/lib/periods";
import RotaryKnob from "@/components/markets/RotaryKnob";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePerf } from "@/components/markets/usePerf";
import InstrumentDialog, { type Selection } from "@/components/markets/InstrumentDialog";
import Bars from "@/components/markets/Bars";
import StrengthGrid from "@/components/markets/Strength";
import OptionsGauge, { type OptionsData } from "@/components/markets/OptionsGauge";
import Heat from "@/components/markets/Heat";
import Sessions from "@/components/markets/Sessions";

const TABS = [["overview", "Overview"], ["bonds", "Bonds"], ["indices", "Indices"], ["currencies", "Currencies"], ["commodities", "Commodities"], ["stocks", "Stocks"], ["macro", "Macro"], ["options", "Options"], ["heatmap", "Heatmap"], ["sessions", "Sessions"]] as const;
export type Tab = (typeof TABS)[number][0];
const NO_OPTIONS: OptionsData = { overall: null };

function Empty({ children }: { children: React.ReactNode }) { return <p className="note py-2">{children}</p>; }

function Panel({ title, sub, right, href, more, children }: { title: string; sub?: string; right?: ReactNode; href?: string; more?: string; children: ReactNode }) {
  return (
    <section className="card mk">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="mk-title">{href ? <Link href={href} className="mk-link" aria-label={`${title}: open the full page`}>{title}<span aria-hidden="true">↗</span></Link> : title}</h2>
          {sub && <p className="note mt-0.5">{sub}</p>}
        </div>
        {right}
      </div>
      {children}
      {href && more && <Link href={href} className="mk-more">{more}<span aria-hidden="true"> →</span></Link>}
    </section>
  );
}

/** A panel of bars with its own small rotary time dial. 1D is the live daily change; longer periods load once from /api/perf.
 *  Yield panels ("yield" mode) show the level plus its change in basis points over the chosen period. */
function PeriodPanel({ title, sub, group, kind, items, decimals, empty, foot, after, mode = "chg", href, limit, pick, onSelect }: {
  title: string; sub: string; group: string; kind: Kind; items: Item[]; decimals?: number; empty: string; foot?: string; after?: ReactNode; mode?: "chg" | "yield"; href?: string; limit?: number; pick?: string[]; onSelect: (s: Selection) => void;
}) {
  const [idx, setIdx] = useState(0);
  const period = PERIODS[idx][0];
  const { perf, failed } = usePerf(group, idx > 0 || mode === "yield");
  const waiting = (idx > 0 || mode === "yield") && !perf && !failed;
  // On the overview a card shows only the most important rows; the full list is one click away.
  const shown = limit && items.length > limit ? [...(pick ? pick.flatMap((l) => items.filter((i) => i.label === l)) : []), ...items.filter((i) => !pick?.includes(i.label))].slice(0, limit).sort((a, b) => items.indexOf(a) - items.indexOf(b)) : items;
  return (
    <Panel title={title} sub={sub} href={href} more={limit && items.length > limit ? `See all ${items.length}` : href ? "Open full page" : undefined} right={items.length ? <RotaryKnob idx={idx} onChange={setIdx} label={title} /> : null}>
      <p className="sr-only" role="status">Showing {PERIODS[idx][1]}</p>
      {items.length ? <Bars items={shown} mode={mode} decimals={decimals} period={period} perf={perf} loading={waiting} onSelect={(i) => onSelect({ item: i, kind, period })} /> : <Empty>{empty}</Empty>}
      {(idx > 0 || mode === "yield") && failed && <p className="note mt-2">{mode === "yield" ? "Yield changes" : "History"} could not be loaded right now. Try again in a few minutes.</p>}
      {after}
      {foot && <p className="note mt-3">{foot}</p>}
    </Panel>
  );
}

/** Currency strength with its own dial: 1D is the live move vs the US dollar, longer periods come from cached daily history of the same pairs. */
function StrengthPanel({ data }: { data: MarketsData["strength"] }) {
  const [idx, setIdx] = useState(0);
  const period = PERIODS[idx][0];
  const { perf, failed } = usePerf("fx", idx > 0);
  const waiting = idx > 0 && !perf && !failed;
  return (
    <Panel title="Currency strength" sub="The dollar and the most traded currencies, one by one" right={data.length ? <RotaryKnob idx={idx} onChange={setIdx} label="Currency strength" /> : null}>
      <p className="sr-only" role="status">Showing {PERIODS[idx][1]}</p>
      {data.length ? <StrengthGrid data={data} period={period} perf={perf} loading={waiting} /> : <Empty>Currency strength is unavailable right now.</Empty>}
      {idx > 0 && failed && <p className="note mt-2">History could not be loaded right now. Try again in a few minutes.</p>}
    </Panel>
  );
}

const fmtMacro = (v: number, unit: string) => unit === "%" ? `${v.toFixed(2)}%` : unit === "pp" ? `${v.toFixed(2)} pp` : unit === "K" ? `${Math.round(v / 1000)}K` : v.toFixed(2);
const fmtDelta = (d: number, unit: string) => `${d > 0 ? "▲ +" : d < 0 ? "▼ " : "■ "}${unit === "K" ? `${Math.round(d / 1000)}K` : Math.abs(d) >= 100 ? d.toFixed(0) : d.toFixed(2)}`;

/** Macro indicators. Values come from FRED, each with the date of its reading. The change is simply versus the reading before: an arrow does not say whether the move is good or bad. */
function MacroPanel({ data, home }: { data: MarketsData["macro"]; home: boolean }) {
  const list = home ? data.filter((m) => m.home) : data;
  const groups = [...new Set(list.map((m) => m.group))];
  return (
    <Panel title="Macro indicators" sub="What drives the market: volatility, rates, inflation, jobs" href={home ? "/markets/macro" : undefined} more={home && data.length > list.length ? `See all ${data.length}` : undefined}>
      {list.length === 0 ? <Empty>Macro data is unavailable right now.</Empty> : groups.map((g) => (
        <section key={g} aria-label={g} className="mb-3 last:mb-0">
          <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">{g}</h3>
          <ul>
            {list.filter((m) => m.group === g).map((m) => {
              const d = m.value != null && m.prev != null ? m.value - m.prev : null;
              return (
                <li key={m.id} className="flex items-baseline justify-between gap-3 py-1.5 text-sm" title={m.note}>
                  <span className="min-w-0"><span className="block truncate">{m.label}</span>{!home && <span className="block text-[11.5px] leading-snug text-muted">{m.note}</span>}</span>
                  <span className="shrink-0 text-right font-mono tabular-nums">{m.value == null ? "—" : fmtMacro(m.value, m.unit)}
                    {d != null && <span className="ml-2 text-xs text-muted">{fmtDelta(d, m.unit)}</span>}
                    {m.date && <span className="block text-[10.5px] text-muted">{m.date}</span>}</span>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </Panel>
  );
}

export default function MarketsTabs({ data, initial = "overview" }: { data: MarketsData; initial?: Tab }) {
  const [tab, setTab] = useState<Tab>(initial);
  const home = tab === "overview";
  const [sel, setSel] = useState<Selection | null>(null);
  const router = useRouter();
  /** A click goes to the instrument's own page (/markets/NVDA, /indicators/us-cpi) when one exists; otherwise the quick chart opens. */
  const open = (s: Selection) => { if (s.item.href) router.push(s.item.href); else setSel(s); };
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  const onKey = (e: React.KeyboardEvent, i: number) => {
    const k = e.key; if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(k)) return;
    e.preventDefault();
    const j = k === "Home" ? 0 : k === "End" ? TABS.length - 1 : (i + (k === "ArrowRight" ? 1 : -1) + TABS.length) % TABS.length;
    setTab(TABS[j][0]); refs.current[TABS[j][0]]?.focus();
  };

  const vix = data.vix;
  const vixRow = vix && (
    <p className="mt-3 flex items-baseline justify-between border-t border-line pt-3 text-sm">
      <span>VIX volatility index{vix.saved && <span className="ml-1 rounded bg-surface2 px-1.5 py-0.5 text-[10px] text-muted">Saved value</span>}</span>
      {vix.value == null ? <span className="text-xs text-muted">{vix.reason}</span> : <span className="font-mono tabular-nums">{vix.value.toFixed(2)}<span className="ml-1 text-xs text-muted">{vix.date}</span></span>}
    </p>
  );
  const bonds = <PeriodPanel title="Bonds" sub="Yield and change, in basis points" group="bonds" kind="bond" mode="yield" items={data.yields} empty="Yields are unavailable right now." after={vixRow} href={home ? "/markets/bonds" : undefined} limit={home ? 5 : undefined} pick={["US 2-year Treasury", "US 10-year Treasury", "Germany 10-year Bund", "UK 10-year gilt", "Japan 10-year JGB"]} onSelect={open} />;
  const indices = <PeriodPanel title="Indices" sub="Benchmark indices, by region" group="indices" href={home ? "/markets/indices" : undefined} limit={home ? 5 : undefined} kind="index" items={data.indices} empty="Index data is unavailable right now." onSelect={open} />;
  const commodities = <PeriodPanel title="Commodities" sub="Metals and energy, in US dollars" group="commodities" href={home ? "/markets/commodities" : undefined} limit={home ? 5 : undefined} kind="commodity" items={data.commodities} decimals={2} empty="Commodity prices are unavailable right now." onSelect={open} />;
  const stocks = <PeriodPanel title="Stocks" sub="The tickers in Sentiment, by sector" group="stocks" href={home ? "/markets/stocks" : undefined} limit={home ? 6 : undefined} kind="stock" items={data.stocks} empty="Stock quotes are unavailable right now." foot="Prices in US dollars. Quotes can be delayed." onSelect={open} />;
  const fx = <PeriodPanel title="Currencies" sub="Change of the main pairs, majors first" group="fx" href={home ? "/markets/currencies" : undefined} limit={home ? 6 : undefined} kind="fx" items={data.fx} decimals={4} empty="Currency data is unavailable right now." onSelect={open} />;
  const strength = <StrengthPanel data={data.strength} />;
  const macro = <MacroPanel data={data.macro} home={home} />;
  const options = <Panel title="Options" sub="Bullish or bearish: overall and by market"><OptionsGauge data={NO_OPTIONS} /></Panel>;

  return (
    <div className="mk-stage">
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
          <div className="mk-grid grid gap-5 md:grid-cols-2 xl:grid-cols-3">{bonds}{indices}{commodities}{stocks}{fx}{strength}{macro}<div className="md:col-span-2 xl:col-span-3">{options}</div></div>
        )}
        {tab === "bonds" && (
          <div className="space-y-5">{bonds}
            <div className="card overflow-x-auto">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">Government bond yields and VIX by instrument</caption>
                <thead><tr className="text-xs text-muted"><th scope="col" className="py-2 pr-4 font-medium">Instrument</th><th scope="col" className="pr-4 font-medium">Yield</th><th scope="col" className="font-medium">Last updated</th></tr></thead>
                <tbody className="divide-y divide-line">
                  {[...data.yields, ...(vix ? [vix] : [])].map((y) => (
                    <tr key={y.label}><th scope="row" className="py-2 pr-4 font-normal">{y.label}</th><td className="pr-4 font-mono tabular-nums">{y.value == null ? "—" : y.label.startsWith("VIX") ? y.value.toFixed(2) : `${y.value.toFixed(2)}%`}</td><td className="font-mono text-xs text-muted">{y.date ?? y.reason ?? "—"}</td></tr>
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
        {tab === "macro" && <div className="space-y-5">{macro}<p className="note">Source: FRED (Federal Reserve Bank of St. Louis), except SKEW (CBOE) and MOVE (ICE BofA, via a public chart feed), which are listed only when their source answers. Each row shows the date of its latest reading, and the change since the reading before it.</p></div>}
        {tab === "options" && (
          <div className="space-y-5">{options}
            <section className="card">
              <h2 className="text-sm font-semibold">Why options matter</h2>
              <p className="note mt-2 text-[13.5px]">Options show what traders pay to protect against a fall or to bet on a rise. That positioning often moves before prices do, and most retail screens leave it out.</p>
              <p className="note mt-2 text-[13.5px]">The gauge uses the put/call ratio. Below 0.70 reads bullish, above 1.00 bearish, and in between neutral. These cut-offs are a simple convention, and extreme readings are sometimes read the other way. Treat it as context, not a forecast.</p>
            </section>
          </div>
        )}
        {tab === "heatmap" && <Panel title="Heatmap" sub="Today’s moves at a glance. Swipe or use the arrows to change view."><Heat indices={data.indices} fx={data.fx} commodities={data.commodities} stocks={data.stocks} /></Panel>}
        {tab === "sessions" && <Sessions />}
      </div>
      <InstrumentDialog sel={sel} yields={data.yields} onClose={() => setSel(null)} />
    </div>
  );
}

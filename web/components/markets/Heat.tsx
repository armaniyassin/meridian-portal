"use client";
import { useMemo, useRef, useState } from "react";
import { HUBS, REGIONS } from "@/lib/hubs";
import { squarify } from "@/lib/treemap";
import type { Item } from "@/lib/markets-view";

const W = 1000, H = 500, G = 28;
const sign = (v: number) => `${v > 0 ? "▲ +" : v < 0 ? "▼ " : "■ "}${v.toFixed(2)}%`;
const tone = (v: number) => (v > 0 ? "text-upt" : v < 0 ? "text-downt" : "");
const GROUP_NAME: Record<string, string> = { "Majors (USD quote)": "Majors", "USD against others": "Against the dollar" };
const CITY: Record<string, string> = Object.fromEntries(HUBS.map((h) => [h.idx, h.name]));

type Tile = { name: string; sub: string; group: string; v: number; price?: number | null; w: number };
type ViewDef = { key: string; title: string; blurb: string; order: string[]; tiles: Tile[]; decimals: number };

const toTiles = (items: Item[], sub: (i: Item) => string): Tile[] =>
  items.filter((i) => i.value != null).map((i) => ({ name: i.label, sub: sub(i), group: i.group, v: i.value as number, price: i.price, w: 1 }));
const avg = (t: Tile[]) => (t.length ? t.reduce((s, x) => s + x.v, 0) / t.length : 0);

/** Finviz-style treemap carousel. Tiles are equal-sized until market-cap weights exist. Shade shows the size of the move; the arrow and sign carry direction. */
export default function Heat({ indices, fx, commodities, stocks }: { indices: Item[]; fx: Item[]; commodities: Item[]; stocks: Item[] }) {
  const views: ViewDef[] = useMemo(() => [
    { key: "idx", title: "Indices", blurb: "Benchmark indices by region", order: [...REGIONS], tiles: toTiles(indices, (i) => CITY[i.label] ?? "Index"), decimals: 2 },
    { key: "fx", title: "Currencies", blurb: "Main pairs against the dollar", order: ["Majors (USD quote)", "USD against others"], tiles: toTiles(fx, () => "Pair"), decimals: 4 },
    { key: "com", title: "Commodities", blurb: "Metals and energy, in US dollars", order: ["Metals", "Energy"], tiles: toTiles(commodities, (i) => i.group), decimals: 2 },
    { key: "stk", title: "Stocks", blurb: "Sentiment tickers by sector", order: [...new Set(stocks.map((s) => s.group))], tiles: toTiles(stocks, (i) => i.group), decimals: 2 },
  ].filter((v) => v.tiles.length > 0), [indices, fx, commodities, stocks]);

  const [idx, setIdx] = useState(0);
  const [sel, setSel] = useState<Record<string, string>>({});
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const touch = useRef<number | null>(null);
  const n = views.length;
  if (!n) return <p className="note">Heatmap data is unavailable right now.</p>;
  const go = (i: number, focus = false) => { const j = (i + n) % n; setIdx(j); if (focus) tabs.current[j]?.focus(); };
  const onKey = (e: React.KeyboardEvent, i: number) => {
    if (e.key === "ArrowRight") { e.preventDefault(); go(i + 1, true); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); go(i - 1, true); }
    else if (e.key === "Home") { e.preventDefault(); go(0, true); }
    else if (e.key === "End") { e.preventDefault(); go(n - 1, true); }
  };

  return (
    <div className="hx" style={{ ["--n" as string]: n }}>
      <div className="hx-bar">
        <div role="tablist" aria-label="Heatmap views" className="hx-tabs">
          <span className="hx-pill" aria-hidden="true" style={{ transform: `translateX(${idx * 100}%)` }} />
          {views.map((v, i) => (
            <button key={v.key} id={`hxt-${v.key}`} role="tab" type="button" ref={(el) => { tabs.current[i] = el; }}
              aria-selected={idx === i} aria-controls={`hxp-${v.key}`} tabIndex={idx === i ? 0 : -1}
              onClick={() => setIdx(i)} onKeyDown={(e) => onKey(e, i)}>{v.title}</button>
          ))}
        </div>
        <div className="hx-nav">
          <button type="button" aria-label="Previous view" onClick={() => go(idx - 1)}>‹</button>
          <span className="font-mono" aria-hidden="true">{idx + 1} / {n}</span>
          <button type="button" aria-label="Next view" onClick={() => go(idx + 1)}>›</button>
        </div>
      </div>

      <div className="hx-vp" onTouchStart={(e) => { touch.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => { if (touch.current == null) return; const d = e.changedTouches[0].clientX - touch.current; touch.current = null; if (Math.abs(d) > 50) go(idx + (d < 0 ? 1 : -1)); }}>
        <div className="hx-track" style={{ transform: `translateX(-${idx * 100}%)` }}>
          {views.map((v, vi) => {
            const on = vi === idx;
            const groups = v.order.map((g) => ({ g, w: v.tiles.filter((t) => t.group === g).length })).filter((g) => g.w > 0);
            const gl = squarify(groups.map((g) => ({ ...g, w: g.w })), 0, 0, W, H);
            const sorted = [...v.tiles].sort((a, b) => b.v - a.v);
            const up = v.tiles.filter((t) => t.v > 0).length, down = v.tiles.filter((t) => t.v < 0).length;
            const selName = sel[v.key] ?? sorted.reduce((m, t) => (Math.abs(t.v) > Math.abs(m.v) ? t : m), sorted[0]).name;
            const cur = v.tiles.find((t) => t.name === selName) ?? sorted[0];
            const rank = [...v.tiles].sort((a, b) => b.v - a.v).findIndex((t) => t === cur) + 1;
            const gAvg = avg(v.tiles.filter((t) => t.group === cur.group));
            let k = 0;
            return (
              <div key={v.key} id={`hxp-${v.key}`} role="tabpanel" aria-labelledby={`hxt-${v.key}`} aria-hidden={!on} {...(on ? {} : { inert: true })} className={`hx-slide ${on ? "on" : ""}`}>
                <div className="hx-sum">
                  <p className="hx-blurb">{v.blurb}</p>
                  <ul className="hx-chips">
                    <li><span className="text-upt">▲ {up}</span> up</li>
                    <li><span className="text-downt">▼ {down}</span> down</li>
                    <li>Strongest <b>{sorted[0].name}</b> <span className={`font-mono ${tone(sorted[0].v)}`}>{sign(sorted[0].v)}</span></li>
                    <li>Weakest <b>{sorted[sorted.length - 1].name}</b> <span className={`font-mono ${tone(sorted[sorted.length - 1].v)}`}>{sign(sorted[sorted.length - 1].v)}</span></li>
                  </ul>
                </div>
                <div className="hx-map" role="group" aria-label={`${v.title} heatmap`}>
                  {gl.map((g) => {
                    const its = v.tiles.filter((t) => t.group === g.i.g);
                    const cells = squarify(its, g.x, g.y + G, g.w, g.h - G);
                    const ga = avg(its);
                    return (
                      <div key={g.i.g}>
                        <div className="hx-g" style={{ left: `${(g.x / W) * 100}%`, top: `${(g.y / H) * 100}%`, width: `${(g.w / W) * 100}%`, height: `${(g.h / H) * 100}%` }}>
                          <span className="hx-gn">{GROUP_NAME[g.i.g] ?? g.i.g}</span>
                          <span className={`hx-ga font-mono ${tone(ga)}`}>{sign(ga)}</span>
                        </div>
                        {cells.map((c) => {
                          const t = c.i, p = Math.round(14 + Math.min(Math.abs(t.v) / 3, 1) * 26); // capped so text keeps 4.5:1 contrast
                          const bg = `color-mix(in srgb, var(${t.v >= 0 ? "--up" : "--down"}) ${p}%, var(--surface2))`;
                          const big = c.h > 78 && c.w > 120;
                          return (
                            <div key={t.name} className="hx-c" style={{ left: `${(c.x / W) * 100}%`, top: `${(c.y / H) * 100}%`, width: `${(c.w / W) * 100}%`, height: `${(c.h / H) * 100}%`, ["--d" as string]: `${(k++) * 35}ms` }}>
                              <button type="button" className={`hx-t ${cur.name === t.name ? "sel" : ""}`} style={{ background: bg }}
                                aria-pressed={cur.name === t.name}
                                aria-label={`${t.name}, ${t.sub}: ${sign(t.v)}`}
                                onMouseEnter={() => setSel((s) => ({ ...s, [v.key]: t.name }))}
                                onFocus={() => setSel((s) => ({ ...s, [v.key]: t.name }))}
                                onClick={() => setSel((s) => ({ ...s, [v.key]: t.name }))}>
                                <b>{t.name}</b>
                                {big && <small>{t.sub}</small>}
                                <span className="font-mono">{sign(t.v)}</span>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
                <div className="hx-read" aria-live="polite">
                  <div>
                    <p className="hx-rn"><b>{cur.name}</b> <span className="text-muted">{cur.sub}</span></p>
                    <p className="note">Rank {rank} of {v.tiles.length} by move · {GROUP_NAME[cur.group] ?? cur.group} average <span className="font-mono">{sign(gAvg)}</span></p>
                  </div>
                  <p className="hx-rv font-mono">
                    {cur.price != null && <span className="text-muted">{cur.price.toFixed(v.decimals)} </span>}
                    <span className={tone(cur.v)}>{sign(cur.v)}</span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="hx-foot">
        <div className="hx-dots" aria-hidden="true">{views.map((v, i) => <button key={v.key} type="button" tabIndex={-1} className={i === idx ? "on" : ""} onClick={() => setIdx(i)} />)}</div>
        <div className="hmleg" aria-hidden="true"><span>−3%</span><i /><span>+3%</span></div>
      </div>
      <p className="note mt-3">Shade grows with the size of the daily move, up to 3%. Tiles are the same size until market-cap weights are available. Only instruments with live data appear.</p>
    </div>
  );
}

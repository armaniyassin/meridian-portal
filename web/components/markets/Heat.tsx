"use client";
import { useState } from "react";
import { HUBS, REGIONS, HUB_COUNT_WORD, regionOf } from "@/lib/hubs";
import { squarify } from "@/lib/treemap";
import type { Item } from "@/lib/markets-view";

type View = "idx" | "fx" | "bond" | "com";
const VIEWS: [View, string][] = [["idx", "Indices"], ["fx", "Currencies"], ["bond", "Bonds"], ["com", "Commodities"]];
const W = 1000, H = 520, G = 26;

type Tile = { name: string; sub: string; reg: string; v: number | null; level?: string; w: number };
const sign = (v: number) => `${v > 0 ? "▲ +" : v < 0 ? "▼ " : "■ "}${v.toFixed(2)}%`;

/** Finviz-style treemap. Tiles are equal-sized until market-cap weights exist. Shade shows the size of the move; the arrow and sign carry direction. */
export default function Heat({ indices, fx, yields, commodities }: { indices: Item[]; fx: Item[]; yields: Item[]; commodities: Item[] }) {
  const [view, setView] = useState<View>("idx");
  const byLabel = (list: Item[], l: string) => list.find((i) => i.label === l);

  const tiles: Tile[] = view === "idx"
    ? HUBS.map((h) => ({ name: h.idx, sub: h.name, reg: regionOf(h), v: byLabel(indices, h.idx)?.value ?? null, w: 1 }))
    : view === "fx"
      ? [...new Set(HUBS.map((h) => h.fx))].map((p) => { const h = HUBS.find((x) => x.fx === p)!; return { name: p, sub: h.name, reg: regionOf(h), v: byLabel(fx, p)?.value ?? null, w: 1 }; })
      : view === "com"
        ? commodities.map((c) => ({ name: c.label, sub: c.group ?? "", reg: c.group ?? "Other", v: c.value, w: 1 }))
        : HUBS.filter((h) => h.bsrc).map((h) => {
          const us = h.id === "nyc" ? yields.find((y) => y.label === "US 10-year Treasury") : undefined;
          return { name: h.bond.replace(" 10-year", "").replace(" gilt", ""), sub: "10-year · " + h.name, reg: regionOf(h), v: null, level: us?.value != null ? `${us.value.toFixed(2)}%` : undefined, w: 1 };
        });

  const order: string[] = view === "com" ? ["Metals", "Energy"] : [...REGIONS];
  const regs = order.map((r) => ({ r, w: tiles.filter((t) => t.reg === r).reduce((s, t) => s + t.w, 0) })).filter((g) => g.w > 0);
  const groups = squarify(regs, 0, 0, W, H);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div role="group" aria-label="Heatmap view" className="flex rounded-lg border border-line p-0.5">
          {VIEWS.map(([k, name]) => (
            <button key={k} type="button" aria-pressed={view === k} onClick={() => setView(k)} className={`rounded-md px-3 py-1.5 text-sm font-semibold ${view === k ? "bg-surface2" : "text-muted"}`}>{name}</button>
          ))}
        </div>
        <div className="hmleg" aria-hidden="true"><span>−3%</span><i /><span>+3%</span></div>
      </div>
      <div className="hm" role="group" aria-label={`Market heatmap: ${VIEWS.find((v) => v[0] === view)![1]}`}>
        {groups.map((g) => {
          const its = tiles.filter((t) => t.reg === g.i.r);
          const cells = squarify(its, g.x, g.y + G, g.w, g.h - G);
          return (
            <div key={g.i.r}>
              <div className="hmg" style={{ left: `${(g.x / W) * 100}%`, top: `${(g.y / H) * 100}%`, width: `${(g.w / W) * 100}%`, height: `${(g.h / H) * 100}%` }}>
                <span className="hmr">{g.i.r}</span>
              </div>
              {cells.map((c) => {
                const t = c.i, v = t.v;
                const p = v == null ? 0 : Math.round(14 + Math.min(Math.abs(v) / 3, 1) * 26); // capped so text keeps 4.5:1 contrast in both themes
                const bg = v == null ? undefined : `color-mix(in srgb, var(${v >= 0 ? "--up" : "--down"}) ${p}%, var(--surface2))`;
                return (
                  <div key={t.name} className={`hmt ${v == null ? "na" : ""}`} role="img"
                    aria-label={`${t.name}, ${t.sub}: ${v != null ? sign(v) : t.level ? `yield ${t.level}` : "awaiting feed"}`}
                    style={{ left: `${(c.x / W) * 100}%`, top: `${(c.y / H) * 100}%`, width: `${(c.w / W) * 100}%`, height: `${(c.h / H) * 100}%`, background: bg, color: v == null ? undefined : "var(--text)" }}>
                    <b>{t.name}</b><small>{t.sub}</small>
                    <span className="mono">{v != null ? sign(v) : t.level ?? "—"}</span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
      <p className="note mt-3">Shade grows with the size of the daily move, up to 3%. {view === "com" ? "Commodity prices are in US dollars per unit. " : ""}{view === "bond" ? "Bond tiles stay neutral because yield changes are not connected yet. " : ""}Tiles are the same size until market-cap weights are available. Tiles marked with a dash are waiting for a data feed.</p>
    </div>
  );
}

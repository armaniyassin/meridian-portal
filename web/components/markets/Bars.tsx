import { useRef, useState } from "react";
import type { Item } from "@/lib/markets-view";
import HoverPreview from "@/components/markets/HoverPreview";
import { P_FLOOR, type Perf, type PeriodKey } from "@/lib/periods";

const fmtChg = (v: number) => `${v > 0 ? "▲ +" : v < 0 ? "▼ " : "■ "}${v.toFixed(2)}%`;
const fmtBp = (v: number) => `${v > 0 ? "▲ +" : v < 0 ? "▼ " : "■ "}${Math.round(v)} bp`;
const tone = (v: number | null) => (v == null ? "text-muted" : v > 0 ? "text-upt" : v < 0 ? "text-downt" : "");

const Saved = () => (
  <span className="ml-1 rounded bg-surface2 px-1.5 py-0.5 text-[10px] text-muted">Saved value</span>
);

/** One group of rows. Values are always printed as text with a sign and arrow, so colour is never the only signal.
 *  In "chg" mode the value follows the selected period: 1D is the live daily change, the others come from `perf` (worked out from real history). */
export default function Bars({ items, mode, decimals = 2, period = "1D", perf = null, loading = false, onSelect, cols = 1 }: {
  items: Item[]; mode: "yield" | "chg"; decimals?: number; cols?: 1 | 2; period?: PeriodKey; perf?: Record<string, Perf> | null; loading?: boolean; onSelect?: (i: Item) => void;
}) {
  const valueOf = (i: Item): number | null => (mode === "chg" && period !== "1D" ? perf?.[i.label]?.[period] ?? null : i.value);
  const vals = items.map(valueOf).filter((v): v is number => v != null);
  const max = mode === "yield" ? Math.max(6, ...vals) : period === "1D" ? P_FLOOR["1D"] : Math.max(P_FLOOR[period], ...vals.map(Math.abs));
  const deltaOf = (i: Item): number | null => (mode === "yield" ? perf?.[i.label]?.[period] ?? null : null);
  const groups = [...new Set(items.map((i) => i.group))];
  const [hov, setHov] = useState<{ i: Item; r: DOMRect } | null>(null), timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const show = (i: Item, el: HTMLElement) => { clearTimeout(timer.current); timer.current = setTimeout(() => setHov({ i, r: el.getBoundingClientRect() }), 280); };
  const hide = () => { clearTimeout(timer.current); setHov(null); };
  return (
    <div className={cols === 2 ? "chart-wide" : ""}>
      {groups.map((g) => (
        <section key={g} aria-label={g} className="mb-3 last:mb-0">
          <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">{g}</h3>
          <ul>
            {items.filter((i) => i.group === g).map((i) => {
              const v = valueOf(i), d = deltaOf(i), wait = mode === "chg" && period !== "1D" && loading && v == null;
              const w = v == null ? 0 : Math.min(50, (Math.abs(v) / max) * 50);
              const row = (
                <>
                  <span className="truncate text-left" title={i.label}>{i.label}{i.saved && <Saved />}</span>
                  <span aria-hidden="true" className="relative h-1.5 rounded bg-surface2">
                    {v != null && mode === "yield" && (
                      <i className="absolute left-0 top-0 h-full rounded bg-accent" style={{ width: `${Math.min(100, (v / max) * 100)}%` }} />
                    )}
                    {v != null && mode === "chg" && (
                      <i className={`bar-fill absolute top-0 h-full rounded ${v >= 0 ? "bg-up" : "bg-down"}`} style={{ left: v >= 0 ? "50%" : `${50 - w}%`, width: `${w}%` }} />
                    )}
                  </span>
                  {v == null ? (
                    <span className="text-xs text-muted">{wait ? "…" : "—"}</span>
                  ) : mode === "yield" ? (
                    <span className="font-mono tabular-nums" title={i.date ? `Observed ${i.date}` : undefined}>{v.toFixed(2)}%{!i.symbol && i.date && <span className="ml-2 text-[11px] text-muted">{i.date.slice(0, 7)}</span>}
                      {d != null ? <span className={`ml-2 ${tone(d)}`}>{fmtBp(d)}</span> : loading ? <span className="ml-2 text-muted">…</span> : null}</span>
                  ) : (
                    <span className="font-mono tabular-nums">
                      {i.price != null && <span className="mr-2 text-muted">{i.price.toFixed(decimals)}</span>}
                      <span className={tone(v)}>{fmtChg(v)}</span>
                    </span>
                  )}
                </>
              );
              const cls = `grid w-full grid-cols-[minmax(0,9.5rem)_1fr_auto] items-center gap-3 text-sm ${cols === 2 ? "py-2" : "py-1.5"}`;
              return (
                <li key={i.label}>
                  {onSelect && i.symbol ? (
                    <button type="button" className={`row-btn ${cls}`} onClick={() => { hide(); onSelect(i); }} onMouseEnter={(e) => show(i, e.currentTarget)} onMouseLeave={hide} onFocus={(e) => show(i, e.currentTarget)} onBlur={hide} aria-label={`${i.label}: open chart and fundamentals`}>{row}</button>
                  ) : <div className={cls}>{row}</div>}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
      {hov?.i.symbol && <HoverPreview symbol={hov.i.symbol} label={hov.i.label} rect={hov.r} bond={mode === "yield"} decimals={mode === "yield" ? 2 : decimals} />}
    </div>
  );
}

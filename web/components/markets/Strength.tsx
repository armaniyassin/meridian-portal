import type { Strength } from "@/lib/markets-view";
import type { Perf, PeriodKey } from "@/lib/periods";

/** One tile per currency against the US dollar. For 1D it is the live move; for longer periods it is worked out from the pair's real history
 *  (a USD/XXX pair moves against the currency, so its change is inverted). No history, no number: the tile shows a dash. */
export default function StrengthGrid({ data, period = "1D", perf = null, loading = false }: { data: Strength[]; period?: PeriodKey; perf?: Record<string, Perf> | null; loading?: boolean }) {
  const valueOf = (c: Strength): number | null => {
    if (period === "1D") return c.chg;
    const p = perf?.[c.pair]?.[period];
    return p == null ? null : c.inv ? (100 / (100 + p) - 1) * 100 : p;
  };
  return (
    <>
      <ul className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(118px, 1fr))" }}>
        {data.map((c) => {
          const v = valueOf(c), wait = period !== "1D" && loading && v == null;
          return (
            <li key={c.code} className="rounded-lg border border-line p-3">
              <div className="flex items-baseline gap-2"><b>{c.code}</b><span className="truncate text-xs text-muted">{c.name}</span></div>
              <div className={`mt-1 font-mono text-lg tabular-nums ${v == null ? "text-muted" : v > 0 ? "text-upt" : v < 0 ? "text-downt" : ""}`}>
                {wait ? "…" : v == null ? "—" : `${v > 0 ? "▲ +" : v < 0 ? "▼ " : "■ "}${v.toFixed(2)}%`}
              </div>
              <div className="text-xs text-muted">{period === "1D" && c.saved ? "Saved value vs US dollar" : "vs US dollar"}</div>
            </li>
          );
        })}
      </ul>
      <p className="note mt-3">Up means the currency gained against the US dollar over the chosen period, down means it lost. Worked out from the pairs shown in Currencies.</p>
    </>
  );
}

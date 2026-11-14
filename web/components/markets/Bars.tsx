import type { Item } from "@/lib/markets-view";

const fmtChg = (v: number) => `${v > 0 ? "▲ +" : v < 0 ? "▼ " : "■ "}${v.toFixed(2)}%`;
const tone = (v: number | null) => (v == null ? "text-muted" : v > 0 ? "text-upt" : v < 0 ? "text-downt" : "");

const Saved = () => (
  <span className="ml-1 rounded bg-surface2 px-1.5 py-0.5 text-[10px] text-muted">Saved value</span>
);

/** One group of rows. Values are always printed as text with a sign and arrow, so colour is never the only signal. */
export default function Bars({ items, mode, decimals = 2 }: { items: Item[]; mode: "yield" | "chg"; decimals?: number }) {
  const have = items.filter((i) => i.value != null) as (Item & { value: number })[];
  const max = mode === "yield" ? Math.max(6, ...have.map((i) => i.value)) : 3;
  const groups = [...new Set(items.map((i) => i.group))];
  return (
    <div>
      {groups.map((g) => (
        <section key={g} aria-label={g} className="mb-3 last:mb-0">
          <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">{g}</h3>
          <ul>
            {items.filter((i) => i.group === g).map((i) => (
              <li key={i.label} className="grid grid-cols-[minmax(0,9.5rem)_1fr_auto] items-center gap-3 py-1.5 text-sm">
                <span className="truncate" title={i.label}>{i.label}{i.saved && <Saved />}</span>
                <span aria-hidden="true" className={`relative h-1.5 rounded bg-surface2 ${mode === "chg" ? "" : ""}`}>
                  {i.value != null && mode === "yield" && (
                    <i className="absolute left-0 top-0 h-full rounded bg-accent" style={{ width: `${Math.min(100, (i.value / max) * 100)}%` }} />
                  )}
                  {i.value != null && mode === "chg" && (
                    <i
                      className={`absolute top-0 h-full rounded ${i.value >= 0 ? "bg-up" : "bg-down"}`}
                      style={{ left: i.value >= 0 ? "50%" : `${50 - Math.min(50, (Math.abs(i.value) / max) * 50)}%`, width: `${Math.min(50, (Math.abs(i.value) / max) * 50)}%` }}
                    />
                  )}
                </span>
                {i.value == null ? (
                  <span className="text-xs text-muted">{i.reason ?? "Awaiting feed"}</span>
                ) : mode === "yield" ? (
                  <span className="font-mono tabular-nums">{i.value.toFixed(2)}%{i.date && <span className="ml-1 text-xs text-muted">{i.date}</span>}</span>
                ) : (
                  <span className="font-mono tabular-nums">
                    {i.price != null && <span className="mr-2 text-muted">{i.price.toFixed(decimals)}</span>}
                    <span className={tone(i.value)}>{fmtChg(i.value)}</span>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

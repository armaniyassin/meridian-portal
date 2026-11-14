import type { Item } from "@/lib/markets-view";

/** Equal-sized tiles until market-cap weights exist. Shade shows size of the daily move; the sign and arrow carry the direction. */
export default function Heat({ items }: { items: Item[] }) {
  const regions = [...new Set(items.map((i) => i.group))];
  return (
    <div>
      {regions.map((g) => (
        <section key={g} aria-label={g} className="mb-5">
          <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">{g}</h3>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {items.filter((i) => i.group === g).map((i) => {
              const v = i.value;
              const mix = v == null ? 0 : Math.round(Math.min(1, Math.abs(v) / 3) * 55);
              const bg = v == null ? "var(--surface2)" : `color-mix(in srgb, ${v >= 0 ? "var(--up)" : "var(--down)"} ${mix}%, var(--surface))`;
              return (
                <li key={i.label} className="rounded-lg border border-line p-3" style={{ background: bg }}>
                  <div className="text-sm font-semibold">{i.label}</div>
                  <div className="mt-2 font-mono text-lg tabular-nums">
                    {v == null ? "—" : `${v > 0 ? "▲ +" : v < 0 ? "▼ " : "■ "}${v.toFixed(2)}%`}
                  </div>
                  {v == null && <div className="text-xs text-muted">{i.reason}</div>}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
      <p className="note" aria-label="Legend">Shade grows with the size of the move, up to 3%. Tiles are the same size until market-cap weights are available.</p>
    </div>
  );
}

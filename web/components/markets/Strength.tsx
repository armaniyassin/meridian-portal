import type { Strength } from "@/lib/markets-view";

export default function StrengthGrid({ data }: { data: Strength[] }) {
  return (
    <>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {data.map((c) => {
          const v = c.chg;
          return (
            <li key={c.code} className="rounded-lg border border-line p-3">
              <div className="flex items-baseline gap-2"><b>{c.code}</b><span className="truncate text-xs text-muted">{c.name}</span></div>
              <div className={`mt-1 font-mono text-lg tabular-nums ${v == null ? "text-muted" : v > 0 ? "text-upt" : v < 0 ? "text-downt" : ""}`}>
                {v == null ? "—" : `${v > 0 ? "▲ +" : v < 0 ? "▼ " : "■ "}${v.toFixed(2)}%`}
              </div>
              <div className="text-xs text-muted">{v == null ? "Awaiting feed" : c.saved ? "Saved value vs US dollar" : "vs US dollar"}</div>
            </li>
          );
        })}
      </ul>
      <p className="note mt-3">Up means the currency gained against the US dollar today, down means it lost. Worked out from the pairs above. The dollar index (DXY) is not connected yet.</p>
    </>
  );
}

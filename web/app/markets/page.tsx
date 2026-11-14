import DisclaimerFooter from "@/components/DisclaimerFooter";
import { getMarketSnapshot, type Row } from "@/lib/markets";
import type { FredPoint } from "@/lib/fred";
import type { Quote } from "@/lib/fmp";

export const revalidate = 300;

const utc = (iso: string) => new Date(iso).toISOString().replace("T", " ").slice(0, 16) + " UTC";
const tone = (v: number | null) => (v == null ? "text-slate-400" : v >= 0 ? "text-emerald-500" : "text-rose-500");

function Card({ title, children, note }: { title: string; children: React.ReactNode; note?: string }) {
  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900 p-5">
      <h2 className="mb-3 text-sm font-semibold text-slate-100">{title}</h2>
      <ul className="divide-y divide-slate-800">{children}</ul>
      {note && <p className="mt-3 text-xs text-slate-400">{note}</p>}
    </section>
  );
}
const Missing = ({ label, error }: { label: string; error: string }) => (
  <li className="flex justify-between py-2 text-sm"><span className="text-slate-400">{label}</span><span className="max-w-[60%] truncate text-xs text-slate-500" title={error}>No data: {error}</span></li>
);

function QuoteRows({ rows, decimals }: { rows: Row<Quote>[]; decimals: number }) {
  return rows.map((r) => r.ok ? (
    <li key={r.label} className="flex justify-between py-2 text-sm">
      <span>{r.label}</span>
      <span className="font-mono">
        {r.item.price?.toFixed(decimals) ?? "—"}{" "}
        <span className={tone(r.item.changePct)}>{r.item.changePct == null ? "" : `${r.item.changePct >= 0 ? "+" : ""}${r.item.changePct.toFixed(2)}%`}</span>
      </span>
    </li>
  ) : <Missing key={r.label} label={r.label} error={r.error} />);
}

export default async function MarketsPage() {
  let snap: Awaited<ReturnType<typeof getMarketSnapshot>> | null = null, error = "";
  try { snap = await getMarketSnapshot(); } catch (e) { error = e instanceof Error ? e.message : String(e); }

  if (!snap) return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-2xl font-semibold">Markets</h1>
      <p className="mt-4 rounded-md border border-slate-800 bg-slate-900 p-4 text-sm text-slate-400">Market data is unavailable right now: {error}</p>
    </main>
  );

  const yRows = snap.yields as Row<FredPoint>[];
  return (
    <>
      <main className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="text-2xl font-semibold">Markets</h1>
        <p className="mt-1 text-xs text-slate-400">Last updated <span className="font-mono">{utc(snap.generatedAt)}</span></p>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <Card title="Yields and VIX" note="Source: FRED, about one day of delay.">
            {yRows.map((r) => r.ok ? (
              <li key={r.label} className="flex justify-between py-2 text-sm">
                <span>{r.label}</span>
                <span className="font-mono">{r.item.value?.toFixed(2) ?? "—"}{r.label === "VIX" ? "" : "%"} <span className="text-xs text-slate-500">{r.item.date}</span></span>
              </li>
            ) : <Missing key={r.label} label={r.label} error={r.error} />)}
          </Card>
          <Card title="Indices" note="Source: FMP. Some symbols may be unavailable on the free plan."><QuoteRows rows={snap.indices as Row<Quote>[]} decimals={2} /></Card>
          <Card title="Currencies" note="Source: FMP."><QuoteRows rows={snap.fx as Row<Quote>[]} decimals={4} /></Card>
        </div>
      </main>
      <DisclaimerFooter />
    </>
  );
}

import DisclaimerFooter from "@/components/DisclaimerFooter";
import { getMarketSnapshot, type Row } from "@/lib/markets";
import type { FredPoint } from "@/lib/fred";
import type { Quote } from "@/lib/fmp";

export const revalidate = 300;
export const metadata = { title: "Markets | Meridian" };

const utc = (iso: string) => new Date(iso).toISOString().replace("T", " ").slice(0, 16) + " UTC";
const tone = (v: number | null) => (v == null ? "text-muted" : v >= 0 ? "text-up" : "text-down");
const sign = (v: number) => (v >= 0 ? "+" : "") + v.toFixed(2) + "%";

/** Plain-language reason for a failed row. Technical detail shows only in development. */
function friendly(error: string) {
  if (/HTTP 40[23]/.test(error)) return "Not covered by our data plan";
  if (/missing/i.test(error)) return "Data connection not set up";
  return "Unavailable right now";
}

function Card({ title, note, children }: { title: string; note: string; children: React.ReactNode }) {
  return (
    <section className="card">
      <h2 className="mb-3 text-sm font-semibold">{title}</h2>
      <ul className="divide-y divide-line">{children}</ul>
      <p className="note mt-3">{note}</p>
    </section>
  );
}

function Unavailable({ label, error }: { label: string; error: string }) {
  return (
    <li className="flex items-baseline justify-between gap-4 py-2 text-sm">
      <span className="text-muted">{label}</span>
      <span className="text-xs text-muted" title={process.env.NODE_ENV !== "production" ? error : undefined}>{friendly(error)}</span>
    </li>
  );
}

const Saved = () => <span className="ml-1 rounded bg-surface2 px-1.5 py-0.5 text-[10px] text-muted" title="The provider did not respond, so this is the last value we saved.">Saved</span>;

function QuoteRows({ rows, decimals }: { rows: Row<Quote>[]; decimals: number }) {
  return rows.map((r) => r.ok ? (
    <li key={r.label} className="flex items-baseline justify-between py-2 text-sm">
      <span>{r.label}{r.stale && <Saved />}</span>
      <span className="font-mono tabular-nums">
        {r.item.price?.toFixed(decimals) ?? "—"}{" "}
        <span className={tone(r.item.changePct)}>{r.item.changePct == null ? "" : sign(r.item.changePct)}</span>
      </span>
    </li>
  ) : <Unavailable key={r.label} label={r.label} error={r.error} />);
}

export default async function MarketsPage() {
  let snap: Awaited<ReturnType<typeof getMarketSnapshot>> | null = null, error = "";
  try { snap = await getMarketSnapshot(); } catch (e) { error = e instanceof Error ? e.message : String(e); }

  if (!snap) return (
    <div className="wrap" style={{ paddingTop: 120, minHeight: "60vh" }}>
      <h1 style={{ fontSize: 40 }}>Markets</h1>
      <p className="card mt-6 text-sm text-muted">
        Market data isn’t available right now. Try again in a few minutes.
        {process.env.NODE_ENV !== "production" && <span className="mt-2 block font-mono text-xs">{error}</span>}
      </p>
    </div>
  );

  const yRows = snap.yields as Row<FredPoint>[];
  return (
    <>
      <div className="wrap" style={{ paddingTop: 120 }}>
        <p className="eyebrow">Live data</p>
        <h1 style={{ fontSize: "clamp(36px,5vw,56px)", lineHeight: 1.05, margin: "8px 0 6px" }}>Markets</h1>
        <p className="note">Last updated <span className="font-mono">{utc(snap.generatedAt)}</span></p>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          <Card title="Yields and VIX" note="Source: FRED. Values are about one day behind.">
            {yRows.map((r) => r.ok ? (
              <li key={r.label} className="flex items-baseline justify-between py-2 text-sm">
                <span>{r.label}{r.stale && <Saved />}</span>
                <span className="font-mono tabular-nums">{r.item.value?.toFixed(2) ?? "—"}{r.label === "VIX" ? "" : "%"} <span className="text-xs text-muted">{r.item.date}</span></span>
              </li>
            ) : <Unavailable key={r.label} label={r.label} error={r.error} />)}
          </Card>
          <Card title="Indices" note="Source: FMP. Daily change. A few indices need a paid data plan."><QuoteRows rows={snap.indices as Row<Quote>[]} decimals={2} /></Card>
          <Card title="Currencies" note="Source: FMP. Daily change."><QuoteRows rows={snap.fx as Row<Quote>[]} decimals={4} /></Card>
        </div>
      </div>
      <DisclaimerFooter />
    </>
  );
}

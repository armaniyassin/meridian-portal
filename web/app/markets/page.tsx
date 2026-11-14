import DisclaimerFooter from "@/components/DisclaimerFooter";
import MarketsTabs from "@/components/markets/MarketsTabs";
import { getMarketSnapshot } from "@/lib/markets";
import { buildView } from "@/lib/markets-view";

export const revalidate = 300;
export const metadata = { title: "Markets | Meridian" };

const utc = (iso: string) => new Date(iso).toISOString().replace("T", " ").slice(0, 16) + " UTC";

export default async function MarketsPage() {
  let data = null, error = "";
  try { data = buildView(await getMarketSnapshot()); } catch (e) { error = e instanceof Error ? e.message : String(e); }

  return (
    <>
      <div className="wrap" style={{ paddingTop: 120 }}>
        <p className="eyebrow">Live data</p>
        <h1 style={{ fontSize: "clamp(36px,5vw,56px)", lineHeight: 1.05, margin: "8px 0 6px" }}>Markets</h1>
        {data ? (
          <>
            <p className="note">Last updated <span className="font-mono">{utc(data.generatedAt)}</span></p>
            <MarketsTabs data={data} />
          </>
        ) : (
          <p className="card mt-6 text-sm text-muted" role="status">
            Market data isn’t available right now. Try again in a few minutes.
            {process.env.NODE_ENV !== "production" && <span className="mt-2 block font-mono text-xs">{error}</span>}
          </p>
        )}
      </div>
      <DisclaimerFooter />
    </>
  );
}

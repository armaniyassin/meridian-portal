import Link from "next/link";
import { notFound } from "next/navigation";
import DisclaimerFooter from "@/components/DisclaimerFooter";
import MarketsTabs, { type Tab } from "@/components/markets/MarketsTabs";
import { getMarketSnapshot } from "@/lib/markets";
import { buildView } from "@/lib/markets-view";

/** One page per Markets card, opened from the overview: it shows everything we have for that group, not just the top rows. */
const GROUPS: Record<string, [Tab, string]> = {
  bonds: ["bonds", "Bonds"], indices: ["indices", "Indices"], currencies: ["currencies", "Currencies"],
  commodities: ["commodities", "Commodities"], stocks: ["stocks", "Stocks"], macro: ["macro", "Macro indicators"],
};
export const revalidate = 300;
export const dynamicParams = false;
export const generateStaticParams = () => Object.keys(GROUPS).map((group) => ({ group }));
export async function generateMetadata({ params }: { params: Promise<{ group: string }> }) { const g = GROUPS[(await params).group]; return g ? { title: `${g[1]} | Markets | Meridian` } : {}; }

const utc = (iso: string) => new Date(iso).toISOString().replace("T", " ").slice(0, 16) + " UTC";

export default async function GroupPage({ params }: { params: Promise<{ group: string }> }) {
  const g = GROUPS[(await params).group];
  if (!g) notFound();
  let data = null, error = "";
  try { data = buildView(await getMarketSnapshot()); } catch (e) { error = e instanceof Error ? e.message : String(e); }
  return (
    <>
      <div className="wrap" style={{ paddingTop: 120 }}>
        <Link className="back" href="/markets">← Markets</Link>
        <h1 style={{ fontSize: "clamp(34px,5vw,52px)", lineHeight: 1.05, margin: "14px 0 6px" }}>{g[1]}</h1>
        {data ? (
          <>
            <p className="note">Last updated <span className="font-mono">{utc(data.generatedAt)}</span></p>
            <MarketsTabs data={data} initial={g[0]} />
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

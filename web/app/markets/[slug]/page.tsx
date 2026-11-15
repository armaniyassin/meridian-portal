import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import DisclaimerFooter from "@/components/DisclaimerFooter";
import MarketsTabs, { type Tab } from "@/components/markets/MarketsTabs";
import InstrumentView from "@/components/seo/InstrumentView";
import LinkDirectory from "@/components/seo/LinkDirectory";
import { getMarketSnapshot } from "@/lib/markets";
import { buildView } from "@/lib/markets-view";
import { INSTRUMENTS, KIND_LABEL, findInstrument } from "@/lib/seo-catalog";
import { utc } from "@/lib/site";

/** /markets/<group> shows a whole table (bonds, indices…); /markets/<SYMBOL> is one indexable page per instrument. Next.js allows one dynamic name per level, hence a single [slug]. */
const GROUPS: Record<string, [Tab, string]> = {
  bonds: ["bonds", "Bonds"], indices: ["indices", "Indices"], currencies: ["currencies", "Currencies"],
  commodities: ["commodities", "Commodities"], stocks: ["stocks", "Stocks"], macro: ["macro", "Macro indicators"],
};
export const revalidate = 300;
// Unknown slugs render on demand so that /markets/nvda can redirect to /markets/NVDA; anything not in the catalogue is a 404 with no API call.
export const dynamicParams = true;
export const generateStaticParams = () => [...Object.keys(GROUPS), ...INSTRUMENTS.map((i) => i.slug)].map((slug) => ({ slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const slug = (await params).slug;
  const g = GROUPS[slug];
  if (g) return { title: `${g[1]} | Markets | Meridian`, alternates: { canonical: `/markets/${slug}` } };
  const i = findInstrument(slug);
  if (!i) return { robots: { index: false } };
  const what = i.kind === "stock" ? "price, P/E, EBITDA and key ratios" : "latest price and change";
  return {
    title: `${i.label} ${KIND_LABEL[i.kind].toLowerCase()}: ${what} | Meridian`,
    description: `${i.label} (${i.symbol}) ${what}, with the time of the last update. Educational information only.`,
    alternates: { canonical: `/markets/${i.slug}` },
    openGraph: { type: "website", url: `/markets/${i.slug}`, title: `${i.label} (${i.symbol})` },
    robots: i.indexable ? undefined : { index: false, follow: true },
  };
}

export default async function MarketsSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const g = GROUPS[slug];
  if (!g) {
    const inst = findInstrument(slug);
    if (!inst) notFound();
    if (inst.slug !== slug) permanentRedirect(`/markets/${inst.slug}`);
    return <InstrumentView inst={inst} />;
  }
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
        <LinkDirectory />
      </div>
      <DisclaimerFooter />
    </>
  );
}

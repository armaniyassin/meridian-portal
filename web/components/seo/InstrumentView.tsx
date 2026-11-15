import Link from "next/link";
import DisclaimerFooter from "@/components/DisclaimerFooter";
import JsonLd from "@/components/seo/JsonLd";
import LinkDirectory from "@/components/seo/LinkDirectory";
import QuestionsSection from "@/components/seo/QuestionsSection";
import FollowButton from "@/components/account/FollowButton";
import AlertForm from "@/components/account/AlertForm";
import { fmtMetric, STOCK_GROUPS } from "@/components/markets/fundamentals-config";
import { getQuote } from "@/lib/fmp";
import { getStockQuote } from "@/lib/finnhub";
import { getFundamentals } from "@/lib/fundamentals";
import { abs, SITE_NAME, utc } from "@/lib/site";
import { KIND_GROUP, KIND_LABEL, type Inst } from "@/lib/seo-catalog";

const safe = async <T,>(p: Promise<T>): Promise<T | null> => { try { return await p; } catch { return null; } };

export async function loadInstrument(i: Inst) {
  const [quote, fund] = await Promise.all([
    safe(i.kind === "stock" ? getStockQuote(i.symbol) : getQuote(i.symbol)),
    i.kind === "stock" ? safe(getFundamentals(i.symbol)) : Promise.resolve(null),
  ]);
  return { quote, fund };
}

export default async function InstrumentView({ inst }: { inst: Inst }) {
  const { quote, fund } = await loadInstrument(inst);
  const q = quote?.data, price = q?.price ?? null, chg = q?.changePct ?? null;
  const rows = fund ? STOCK_GROUPS.map(([title, ms]) => [title, ms.filter(([k]) => fund.data[k] != null)] as const).filter(([, ms]) => ms.length) : [];
  const url = abs(`/markets/${inst.slug}`);
  const title = `${inst.label} ${KIND_LABEL[inst.kind].toLowerCase()}`;
  return (
    <>
      <JsonLd data={{
        "@context": "https://schema.org", "@graph": [
          { "@type": "BreadcrumbList", itemListElement: [
            { "@type": "ListItem", position: 1, name: "Markets", item: abs("/markets") },
            { "@type": "ListItem", position: 2, name: inst.group, item: abs(`/markets/${KIND_GROUP[inst.kind]}`) },
            { "@type": "ListItem", position: 3, name: inst.label, item: url }] },
          { "@type": "WebPage", name: `${title} | ${SITE_NAME}`, url, isPartOf: { "@type": "WebSite", name: SITE_NAME, url: abs("/") },
            ...(quote ? { dateModified: quote.fetchedAt } : {}) },
        ],
      }} />
      <div className="wrap" style={{ paddingTop: 120 }}>
        <Link className="back" href={`/markets/${KIND_GROUP[inst.kind]}`}>← {inst.group}</Link>
        <h1 style={{ fontSize: "clamp(34px,5vw,52px)", lineHeight: 1.05, margin: "14px 0 6px" }}>{inst.label}</h1>
        <p className="lede">{KIND_LABEL[inst.kind]} · {inst.sub} · <span className="font-mono">{inst.symbol}</span></p>

        <div className="acct-row"><FollowButton symbol={inst.symbol} label={inst.label} /></div>

        <section className="card mt-6" aria-labelledby="px">
          <h2 id="px" style={{ fontSize: 18, marginBottom: 8 }}>Latest price</h2>
          {price != null ? (
            <p style={{ margin: 0 }}>
              <span className="font-mono" style={{ fontSize: 34 }}>{price.toLocaleString("en-US", { maximumFractionDigits: 4 })}</span>{" "}
              {chg != null && <span className="font-mono" style={{ color: chg >= 0 ? "var(--pos, #10b981)" : "var(--neg, #f43f5e)" }}>{chg >= 0 ? "▲ +" : "▼ "}{chg.toFixed(2)}%</span>}
            </p>
          ) : <p className="note" role="status" style={{ margin: 0 }}>Price isn’t available right now.</p>}
          {quote && <p className="note" style={{ margin: "8px 0 0" }}>{quote.stale ? "Cached data, last refreshed " : "Updated "}<span className="font-mono">{utc(quote.fetchedAt)}</span></p>}
        </section>

        {inst.kind === "stock" && (
          <section className="mt-6" aria-labelledby="fn">
            <h2 id="fn" style={{ fontSize: 22 }}>Fundamentals</h2>
            {rows.length ? rows.map(([group, ms]) => (
              <div key={group} className="tablewrap mt-4">
                <table>
                  <caption style={{ textAlign: "left", fontWeight: 600, padding: "8px 0" }}>{group}</caption>
                  <thead><tr><th scope="col">Metric</th><th scope="col">Value</th><th scope="col">What it tells you</th></tr></thead>
                  <tbody>{ms.map(([k, label, fmt, , what]) => (
                    <tr key={k}><th scope="row">{label}</th><td className="font-mono">{fmtMetric(fmt, fund!.data[k])}</td><td>{what}</td></tr>
                  ))}</tbody>
                </table>
              </div>
            )) : <p className="note" role="status">Fundamentals aren’t available right now.</p>}
            {fund && <p className="note">Fundamentals {fund.stale ? "cached, " : ""}as of <span className="font-mono">{utc(fund.fetchedAt)}</span></p>}
          </section>
        )}

        <AlertForm targetType="ticker" targetSlug={inst.slug} label={inst.label} />
        <QuestionsSection targetType="ticker" targetSlug={inst.slug} label={inst.label} />

        <p className="note mt-6"><Link href="/sentiment">{inst.kind === "stock" ? "Search sentiment for a ticker →" : "Explore sentiment →"}</Link></p>
        <LinkDirectory current={inst.slug} />
      </div>
      <DisclaimerFooter />
    </>
  );
}

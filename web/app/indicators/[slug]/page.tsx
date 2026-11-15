import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import DisclaimerFooter from "@/components/DisclaimerFooter";
import JsonLd from "@/components/seo/JsonLd";
import SignupNudge from "@/components/account/SignupNudge";
import QuestionsSection from "@/components/seo/QuestionsSection";
import AlertForm from "@/components/account/AlertForm";
import { getFred } from "@/lib/fred";
import { INDICATORS, findIndicator } from "@/lib/seo-catalog";
import { abs, SITE_NAME, utc } from "@/lib/site";

export const revalidate = 3600;
export const dynamicParams = true;
export const generateStaticParams = () => INDICATORS.map((i) => ({ slug: i.slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const i = findIndicator((await params).slug);
  if (!i) return { robots: { index: false } };
  return {
    title: `${i.label}: latest value | Meridian`,
    description: `${i.label}. ${i.note} Source: FRED, Federal Reserve Bank of St. Louis. Educational information only.`,
    alternates: { canonical: `/indicators/${i.slug}` },
    openGraph: { type: "website", url: `/indicators/${i.slug}`, title: i.label },
  };
}

const fmt = (v: number | null | undefined, unit: string) => (v == null ? "n/a" : `${v.toLocaleString("en-US", { maximumFractionDigits: 3 })}${unit === "%" ? "%" : unit === "pp" ? " pp" : ""}`);

export default async function IndicatorPage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const ind = findIndicator(slug);
  if (!ind) notFound();
  if (ind.slug !== slug) permanentRedirect(`/indicators/${ind.slug}`);
  let c = null;
  try { c = await getFred(ind.id, ind.ttl); } catch { /* shown below as unavailable */ }
  const p = c?.data;
  const url = abs(`/indicators/${ind.slug}`);
  const delta = p?.value != null && p.prev != null ? p.value - p.prev : null;
  const related = INDICATORS.filter((x) => x.group === ind.group && x.id !== ind.id).slice(0, 12);
  return (
    <>
      <JsonLd data={{
        "@context": "https://schema.org", "@graph": [
          { "@type": "BreadcrumbList", itemListElement: [
            { "@type": "ListItem", position: 1, name: "Indicators", item: abs("/indicators") },
            { "@type": "ListItem", position: 2, name: ind.label, item: url }] },
          { "@type": "Dataset", name: ind.label, description: ind.note, url, isAccessibleForFree: true,
            creator: { "@type": "Organization", name: "Federal Reserve Bank of St. Louis (FRED)" }, publisher: { "@type": "Organization", name: SITE_NAME },
            ...(p?.date ? { temporalCoverage: p.date } : {}) },
        ],
      }} />
      <div className="wrap" style={{ paddingTop: 120 }}>
        <Link className="back" href="/indicators">← Macro indicators</Link>
        <h1 style={{ fontSize: "clamp(30px,5vw,48px)", lineHeight: 1.08, margin: "14px 0 6px" }}>{ind.label}</h1>
        <p className="lede">{ind.group} · {ind.note}</p>
        <section className="card mt-6" aria-labelledby="val">
          <h2 id="val" style={{ fontSize: 18, marginBottom: 8 }}>Latest value</h2>
          {p?.value != null ? (
            <>
              <p style={{ margin: 0 }}><span className="font-mono" style={{ fontSize: 34 }}>{fmt(p.value, ind.unit)}</span>{" "}<span className="note">for <span className="font-mono">{p.date}</span></span></p>
              {p.prev != null && <p className="note" style={{ margin: "8px 0 0" }}>Previous: <span className="font-mono">{fmt(p.prev, ind.unit)}</span> ({p.prevDate}){delta != null && <> · change <span className="font-mono">{delta >= 0 ? "+" : ""}{delta.toFixed(3)}</span></>}</p>}
            </>
          ) : <p className="note" role="status" style={{ margin: 0 }}>This value isn’t available right now.</p>}
          {c && <p className="note" style={{ margin: "8px 0 0" }}>{c.stale ? "Cached data, last refreshed " : "Updated "}<span className="font-mono">{utc(c.fetchedAt)}</span> · Source: FRED series <span className="font-mono">{ind.id}</span></p>}
        </section>
        <AlertForm targetType="indicator" targetSlug={ind.slug} label={ind.label} />
        <SignupNudge text={`Want an alert when ${ind.label} updates? Sign up free in one click.`} reason={`to get alerts for ${ind.label}`} />
        <QuestionsSection targetType="indicator" targetSlug={ind.slug} label={ind.label} />
        {related.length > 0 && (
          <nav aria-label="Related indicators" className="card mt-6">
            <h2 style={{ fontSize: 18, marginBottom: 10 }}>Related indicators</h2>
            <p className="note" style={{ margin: 0 }}>{related.map((r, n) => <span key={r.id}>{n > 0 && " · "}<Link href={`/indicators/${r.slug}`}>{r.label}</Link></span>)}</p>
          </nav>
        )}
      </div>
      <DisclaimerFooter />
    </>
  );
}

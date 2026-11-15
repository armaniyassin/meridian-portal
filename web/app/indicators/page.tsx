import type { Metadata } from "next";
import Link from "next/link";
import DisclaimerFooter from "@/components/DisclaimerFooter";
import { INDICATORS } from "@/lib/seo-catalog";

export const metadata: Metadata = {
  title: "Macro indicators and bond yields | Meridian",
  description: "Yields, inflation, growth, volatility and credit indicators from FRED, each with its latest value and update time.",
  alternates: { canonical: "/indicators" },
};

export default function IndicatorsIndex() {
  const groups = [...new Set(INDICATORS.map((i) => i.group))];
  return (
    <>
      <div className="wrap" style={{ paddingTop: 120 }}>
        <Link className="back" href="/markets">← Markets</Link>
        <h1 style={{ fontSize: "clamp(34px,5vw,52px)", lineHeight: 1.05, margin: "14px 0 6px" }}>Macro indicators</h1>
        <p className="lede">{INDICATORS.length} series from FRED, the Federal Reserve Bank of St. Louis.</p>
        {groups.map((g) => (
          <section key={g} className="card mt-6" aria-label={g}>
            <h2 style={{ fontSize: 18, marginBottom: 10 }}>{g}</h2>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {INDICATORS.filter((i) => i.group === g).map((i) => <li key={i.id}><Link href={`/indicators/${i.slug}`}>{i.label}</Link> <span className="note">· {i.note}</span></li>)}
            </ul>
          </section>
        ))}
      </div>
      <DisclaimerFooter />
    </>
  );
}

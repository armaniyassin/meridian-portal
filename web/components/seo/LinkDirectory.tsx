import Link from "next/link";
import { INDICATORS, INSTRUMENTS } from "@/lib/seo-catalog";

/** Plain crawlable links to every symbol page; lets visitors and search engines move between pages. */
export default function LinkDirectory({ current }: { current?: string }) {
  const groups = [...new Set(INSTRUMENTS.map((i) => i.group))];
  return (
    <nav aria-label="Browse instruments" className="card mt-6">
      <h2 style={{ fontSize: 18, marginBottom: 10 }}>Browse instruments</h2>
      {groups.map((g) => (
        <p key={g} className="note" style={{ margin: "6px 0" }}>
          <strong>{g}: </strong>
          {INSTRUMENTS.filter((i) => i.group === g).map((i, n) => (
            <span key={i.slug}>{n > 0 && " · "}<Link href={`/markets/${i.slug}`} aria-current={i.slug === current ? "page" : undefined}>{i.label}</Link></span>
          ))}
        </p>
      ))}
      <p className="note" style={{ margin: "6px 0" }}><Link href="/indicators">All {INDICATORS.length} macro indicators →</Link></p>
    </nav>
  );
}

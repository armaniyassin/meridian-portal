import Link from "next/link";
import { HUB_COUNT_WORD } from "@/lib/hubs";

const Arrow = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;

const DOORS = [
  { n: "01", t: "Markets", href: "/markets", d: `Sovereign yields, major currencies, commodities and equity indices for ${HUB_COUNT_WORD} centres across four continents, with a live map of who is open.` },
  { n: "02", t: "Sentiment", href: "/sentiment", d: "Search a ticker for AI sentiment on recent headlines next to core fundamentals. Five reports are free." },
  { n: "03", t: "Academy", href: "/academy", d: "Level-based lessons and quizzes inspired by CFA-level curriculum. The first level is free." },
  { n: "04", t: "News and insights", href: "/news", d: "Market stories that matter, plain-language explainers on how finance works, and words from great investors." },
];

export default function Doors() {
  return (
    <div className="wrap doors">
      <div className="sticky">
        <div className="eyebrow rv">Where to go</div>
        <h2 className="fx" style={{ margin: "12px 0 14px" }}>Four places. Each one does one job.</h2>
        <p className="lede rv">Open a page from the menu or from here. Nothing is crowded onto one screen.</p>
      </div>
      <div className="doorlist">
        {DOORS.map((d, i) => (
          <Link key={d.href} className="door rv" href={d.href} style={{ ["--d" as string]: `${0.05 + i * 0.07}s` }}>
            <div className="n">{d.n}</div><h3>{d.t}</h3><p>{d.d}</p>
            <span className="go">Open {d.t.split(" ")[0]} <Arrow /></span>
          </Link>
        ))}
      </div>
    </div>
  );
}

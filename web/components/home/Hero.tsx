import Link from "next/link";
import GlobeStage from "@/components/home/GlobeStage";

const ARROW = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);

export default function Hero() {
  return (
    <section className="hero" id="hero">
      <div className="glow" />
      <GlobeStage />
      <div className="copy">
        <svg className="mark" width="46" height="46" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
          <circle cx="14" cy="14" r="11" /><ellipse cx="14" cy="14" rx="4.6" ry="11" /><path d="M3.5 10.5h21M3.5 17.5h21" />
        </svg>
        <h1>Meridian</h1>
        <p className="tagline">Institutional grade, made accessible.</p>
        <p className="sub">Meridian follows bonds, currencies, indices and AI sentiment across eleven financial centres, and shows who is trading right now.</p>
        <div className="cta">
          <Link className="b solid lg" href="/markets">Explore markets {ARROW}</Link>
          <Link className="b lg" href="/brief">Get the weekly brief</Link>
        </div>
        <p className="fine" id="disclosures">5 free sentiment reports. Educational information only, not financial advice.</p>
      </div>
    </section>
  );
}

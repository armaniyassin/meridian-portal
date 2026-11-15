import Link from "next/link";

const Arrow = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;

/** News is for market headlines only. The live feed (Finnhub) is not connected yet, so the page says so and shows nothing invented. */
export default function NewsView() {
  return (
    <div className="wrap pg">
      <div className="pg-h">
        <div className="eyebrow">News</div>
        <h1 className="two fx">Read the market. <span className="dim">Not the noise.</span></h1>
        <p className="lede">The market stories that matter, balanced between good and bad news. Each story is removed after two weeks.</p>
      </div>
      <div className="notice rv"><b>Live headlines are not connected yet.</b> Once the Finnhub feed is on, the most important market stories appear here with their source and date. Nothing is shown until then, so nothing is made up.</div>
      <div className="ctabox rv">
        <div><h2 style={{ fontSize: 26, marginBottom: 4 }}>Want to learn while you wait?</h2><p>The Academy has plain-language insights and free Level 1 lessons.</p></div>
        <Link className="b solid lg" href="/academy">Open the Academy <Arrow /></Link>
      </div>
      <div className="ctabox rv" style={{ marginTop: 14 }}>
        <div><h2 style={{ fontSize: 26, marginBottom: 4 }}>Get the Sunday brief</h2><p>One email a week with the market-moving stories and a lesson at your level.</p></div>
        <Link className="b solid lg" href="/brief">Join the brief <Arrow /></Link>
      </div>
    </div>
  );
}

import Link from "next/link";

/** Site footer. Carries the mandatory educational-use disclaimer (Dept 06), so every data page renders it. */
export default function DisclaimerFooter() {
  return (
    <footer className="foot" id="disclosures">
      <div className="in">
        <div className="fcols">
          <div>
            <Link className="brand" href="/" style={{ marginBottom: 8 }}>
              <svg width="24" height="24" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="14" cy="14" r="11" /><ellipse cx="14" cy="14" rx="4.6" ry="11" /><path d="M3.5 10.5h21M3.5 17.5h21" /></svg>
              Meridian
            </Link>
            <p style={{ fontSize: 13, color: "var(--muted)", maxWidth: "30ch" }}>Global markets, sentiment and education in one place.</p>
          </div>
          <nav aria-label="Product"><h2>Product</h2><Link href="/markets">Markets</Link><Link href="/sentiment">Sentiment</Link><Link href="/academy">Academy</Link><Link href="/news">News</Link></nav>
          <div><h2>Resources</h2><Link href="/insights">Insights</Link><Link href="/brief">Weekly brief</Link><Link href="/indicators">Macro indicators</Link><Link href="/data-sources">Data sources</Link><Link href="/pricing">Plans</Link></div>
          <div><h2>Legal</h2><span className="soon">Privacy policy · Coming soon</span><span className="soon">Terms of service · Coming soon</span></div>
        </div>
        <div className="legal">
          <p>The information and sentiment projections on this site are for educational and informational purposes only. They are not financial advice or a recommendation to buy or sell any security.</p>
          <p>Where a data provider has no value, the site shows a dash instead of an estimate. Session hours are typical hours in each exchange’s local time and do not include holidays or breaks.</p>
          <p>Data is cached and refreshed every few minutes, and pages show when they were last updated (UTC). <Link href="/data-sources" style={{ textDecoration: "underline" }}>See every data source</Link>.</p>
        </div>
      </div>
    </footer>
  );
}

import Link from "next/link";
import DisclaimerFooter from "@/components/DisclaimerFooter";

export const metadata = {
  title: "Free and Pro plans | Meridian",
  description: "What you get free on Meridian, and what the Pro plan will add. Free accounts can follow 5 tickers and save 10 articles.",
  alternates: { canonical: "/pricing" },
};

/* Free column = what is enforced today (limits live in the database). Pro column = planned; no payment is taken yet. */
const ROWS: [string, string, string][] = [
  ["News and analysis", "Daily market news and basic macro summaries.", "Unlimited access to The Brief, in-depth reports and predictive analysis."],
  ["Tickers and indicators", "Standard quotes, basic charts and slightly delayed data.", "Real-time data with no delay, custom alerts and advanced macro correlations."],
  ["Saved and watchlist", "Follow up to 5 tickers and save up to 10 articles.", "Unlimited watchlists, research folders and data export."],
  ["Questions and community", "Read public question threads, which are indexed by search engines.", "Ask priority questions, answered by analysts or advanced AI models."],
];

export default function Page() {
  return (
    <>
      <div className="wrap pg">
        <div className="pg-h">
          <div className="eyebrow">Plans</div>
          <h1 className="two fx">Start free. <span className="dim">Grow into Pro.</span></h1>
          <p className="lede">A free account is useful on day one: save an article, follow a ticker such as AAPL, and get an alert when an indicator updates. Pro is coming soon and is not on sale yet.</p>
        </div>
        <div className="tablewrap">
          <table>
            <caption className="sr-only" style={{ position: "absolute", left: -9999 }}>Free plan compared with the planned Pro plan</caption>
            <thead><tr><th scope="col">Feature</th><th scope="col">Free</th><th scope="col">Pro <span className="tag closed">Coming soon</span></th></tr></thead>
            <tbody>
              {ROWS.map(([f, free, pro]) => (
                <tr key={f}><th scope="row">{f}</th><td>{free}</td><td>{pro}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="note" style={{ marginTop: 14, maxWidth: "62ch" }}>Free limits are enforced on our servers. Pro features are plans, not promises of a date, and nothing here is investment advice.</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 22 }}>
          <Link className="b solid lg" href="/markets">Explore markets</Link>
          <Link className="b lg" href="/brief">Get the weekly brief</Link>
        </div>
      </div>
      <DisclaimerFooter />
    </>
  );
}

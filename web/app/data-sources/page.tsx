import DisclaimerFooter from "@/components/DisclaimerFooter";

export const metadata = { title: "Data sources | Meridian", description: "Where every number and map layer on Meridian comes from.", alternates: { canonical: "/data-sources" } };

const SRC: [string, string, string][] = [
  ["FRED (Federal Reserve Bank of St. Louis)", "Government bond yields, VIX and macro indicators.", "Daily or monthly, depending on the series; about a day behind."],
  ["Financial Modeling Prep", "Quotes for indices, currencies, commodities and stocks, and company ratios.", "Cached for a few minutes. Free-plan coverage is partial, so some symbols are left out."],
  ["Finnhub", "Market and company headlines.", "Cached; headlines older than two weeks are removed."],
  ["CelesTrak", "Orbital data for the satellites on the globe.", "Updated about every 2 hours. Positions are computed and approximate."],
  ["TeleGeography Submarine Cable Map", "Internet cable routes on the globe.", "Changes rarely. Shown with credit to TeleGeography."],
  ["OpenSky Network", "Aircraft positions on the globe.", "Refreshed about every 15 minutes."],
];

export default function Page() {
  return (
    <>
      <div className="wrap pg">
        <div className="pg-h">
          <div className="eyebrow">Data sources</div>
          <h1 className="two fx">Where the numbers <span className="dim">come from.</span></h1>
          <p className="lede">Nothing on Meridian is estimated. When a provider has no value, the site shows a dash. Every provider call is cached on our servers.</p>
        </div>
        <div className="tablewrap">
          <table>
            <thead><tr><th scope="col">Provider</th><th scope="col">Used for</th><th scope="col">Freshness</th></tr></thead>
            <tbody>{SRC.map(([a, b, c]) => <tr key={a}><th scope="row">{a}</th><td>{b}</td><td>{c}</td></tr>)}</tbody>
          </table>
        </div>
      </div>
      <DisclaimerFooter />
    </>
  );
}

import Link from "next/link";
import Hero from "@/components/home/Hero";
import Trust from "@/components/home/Trust";
import Tips from "@/components/home/Tips";
import HowItWorks from "@/components/home/HowItWorks";
import Doors from "@/components/home/Doors";
import BriefCta from "@/components/home/BriefCta";
import Heat from "@/components/markets/Heat";
import DisclaimerFooter from "@/components/DisclaimerFooter";
import { getMarketSnapshot } from "@/lib/markets";
import { buildView, type MarketsData } from "@/lib/markets-view";

export const revalidate = 300;

export default async function Home() {
  let data: MarketsData | null = null;
  try { data = buildView(await getMarketSnapshot()); } catch { data = null; }

  return (
    <>
      <Hero />

      <section className="sec first" aria-labelledby="trust-h">
        <div className="wrap">
          <div className="head rv"><div className="eyebrow">Why trust it</div>
            <h2 id="trust-h" className="two fx">Institutional grade <span className="dim">in all we do.</span></h2></div>
          <Trust />
        </div>
      </section>

      <section className="sec" id="tips" aria-labelledby="tips-h">
        <div className="wrap"><div className="head rv"><div className="eyebrow">Tips and facts</div>
          <h2 id="tips-h" className="two fx">Learn it by seeing it. <span className="dim">One picture at a time.</span></h2>
          <p className="lede">Short, visual lessons on bonds, currencies, stocks and risk. Drag, swipe or use the arrows.</p></div></div>
        <Tips />
      </section>

      <section className="sec" id="heatmap" aria-labelledby="heat-h">
        <div className="wrap">
          <div className="head rv"><div className="eyebrow">Heatmap</div>
            <h2 id="heat-h" className="two fx">See the whole market at a glance. <span className="dim">Colour is the move.</span></h2>
            <p className="lede">An interactive map of indices, currencies, commodities and stocks. Switch the view and hover a tile for details.</p></div>
          <div className="rv" style={{ marginTop: 28 }}>
            {data ? <Heat indices={data.indices} fx={data.fx} commodities={data.commodities} stocks={data.stocks} /> : <p className="note">Heatmap data is unavailable right now.</p>}
            <p style={{ marginTop: 14 }}><Link className="b" href="/markets">Open Markets</Link></p>
          </div>
        </div>
      </section>

      <section className="sec" aria-labelledby="how-h">
        <div className="wrap">
          <div className="head rv"><div className="eyebrow">How it works</div>
            <h2 id="how-h" className="two fx">Markets never sleep. <span className="dim">Your screen should keep up.</span></h2>
            <p className="lede">Three data providers feed one cached, timestamped layer. You see the result, never a guess.</p></div>
          <HowItWorks />
        </div>
      </section>

      <section className="sec" aria-label="Where to go"><Doors /></section>

      <BriefCta />
      <DisclaimerFooter />
    </>
  );
}

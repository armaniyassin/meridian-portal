import BriefForm from "@/components/pages/BriefForm";
import DisclaimerFooter from "@/components/DisclaimerFooter";

export const metadata = { title: "Weekly brief | Meridian", description: "A macro and markets summary every Sunday, written for your level." };

export default function Page() {
  return (
    <>
      <div className="wrap pg"><div className="split">
        <div className="sticky">
          <div className="eyebrow">Weekly brief</div>
          <h1 className="two fx" style={{ margin: "12px 0 14px" }}>The week, <span className="dim">at your level.</span></h1>
          <p className="lede">A macro and markets summary every Sunday. Pick beginner, intermediate or advanced and the vocabulary follows.</p>
        </div>
        <div>
          <BriefForm />
          <div className="list rv">
            <div><i /><span><b>Rates and yields.</b> What moved in government bonds and why.</span></div>
            <div><i /><span><b>Currencies and indices.</b> The week across major pairs and equity markets.</span></div>
            <div><i /><span><b>Only market-moving news.</b> A balance of positive and negative stories that matter.</span></div>
          </div>
        </div>
      </div></div>
      <DisclaimerFooter />
    </>
  );
}

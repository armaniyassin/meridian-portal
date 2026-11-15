import Link from "next/link";
import DisclaimerFooter from "@/components/DisclaimerFooter";

export const metadata = { title: "Alert stopped | Meridian", robots: { index: false } };

export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const failed = !!(await searchParams).error;
  return (
    <>
      <div className="wrap" style={{ paddingTop: 120 }}>
        <h1 style={{ fontSize: "clamp(30px,5vw,44px)" }}>{failed ? "That link isn’t valid" : "Alert stopped"}</h1>
        <p className="lede">{failed ? "The link may be incomplete. Open the latest alert email and try again." : "You won’t get more emails for this alert."}</p>
        <p style={{ marginTop: 16 }}><Link className="b solid" href="/markets">Back to Markets</Link></p>
      </div>
      <DisclaimerFooter />
    </>
  );
}

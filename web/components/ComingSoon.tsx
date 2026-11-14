import Link from "next/link";
import DisclaimerFooter from "@/components/DisclaimerFooter";

export default function ComingSoon({ title, text }: { title: string; text: string }) {
  return (
    <>
      <div className="wrap" style={{ paddingTop: 140, minHeight: "60vh" }}>
        <p className="eyebrow">Coming soon</p>
        <h1 style={{ fontSize: "clamp(36px,6vw,64px)", lineHeight: 1.05, margin: "10px 0 14px" }}>{title}</h1>
        <p className="note" style={{ fontSize: 16, maxWidth: "52ch" }}>{text}</p>
        <Link className="b solid lg" href="/markets" style={{ marginTop: 24 }}>See live markets</Link>
      </div>
      <DisclaimerFooter />
    </>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ARTICLES, artById } from "@/lib/content";
import Vis from "@/components/Vis";
import CopyLink from "@/components/pages/CopyLink";
import { InsightCard } from "@/components/pages/Insights";
import DisclaimerFooter from "@/components/DisclaimerFooter";

export const dynamicParams = false;
export const generateStaticParams = () => ARTICLES.map((a) => ({ id: a.id }));
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const a = artById((await params).id);
  return a ? { title: `${a.t} | Meridian`, description: a.lede } : {};
}

export default async function Article({ params }: { params: Promise<{ id: string }> }) {
  const a = artById((await params).id);
  if (!a) notFound();
  const rel = ARTICLES.filter((x) => x.id !== a.id).sort((x, y) => Number(y.cat === a.cat) - Number(x.cat === a.cat)).slice(0, 2);
  return (
    <>
      <div className="wrap pg"><article className="art">
        <Link className="back" href="/academy#insights">← Academy insights</Link>
        <div className="eyebrow" style={{ marginTop: 22 }}>{a.cat} · {a.read} min read</div>
        <h1 className="fx" style={{ margin: "12px 0 16px" }}>{a.t}</h1>
        <p className="lede">{a.lede}</p>
        <Vis k={a.v} className="artvis" />
        {a.b.map((p) => <p key={p} className="ap">{p}</p>)}
        <div className="take"><b>Key takeaway</b><p>{a.k}</p></div>
        <div className="artact"><CopyLink /><Link className="b solid" href="/brief">Get the Sunday brief</Link></div>
        <p className="note" style={{ marginTop: 20 }}>Educational information only. It is not financial advice or a recommendation to buy or sell any security.</p>
        <div className="sh" style={{ marginTop: 44 }}><h2 style={{ fontSize: 22 }}>Keep reading</h2></div>
        <div className="ngrid two">{rel.map((r) => <InsightCard key={r.id} {...r} />)}</div>
      </article></div>
      <DisclaimerFooter />
    </>
  );
}

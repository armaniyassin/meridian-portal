"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ARTICLES, CATS, QUOTES } from "@/lib/content";
import Vis from "@/components/Vis";

const Arrow = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;

export function NewsCard({ id, cat, read, v, t, lede, tag }: { id: string; cat: string; read: number; v: string; t: string; lede: string; tag?: string }) {
  return (
    <Link className="ncard rv" href={`/news/${id}`}>
      <Vis k={v} />
      <div className="tb"><span className="tcat">{tag ?? cat}</span><h3>{t}</h3><p>{lede}</p><span className="meta">{read} min read</span></div>
    </Link>
  );
}

/** News landing. No live feed is connected yet, so it says so and shows our own explainers, clearly labelled as such. */
export default function NewsView() {
  const [cat, setCat] = useState("All");
  const [q, setQ] = useState(0);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setQ((x) => (x + 1) % QUOTES.length), 7000);
    return () => clearInterval(t);
  }, []);
  const list = ARTICLES.filter((a) => cat === "All" || a.cat === cat);
  const Q = QUOTES[q];
  return (
    <div className="wrap pg">
      <div className="pg-h">
        <div className="eyebrow">News and insights</div>
        <h1 className="two fx">Read the market. <span className="dim">Not the noise.</span></h1>
        <p className="lede">Market headlines that matter, and plain-language explainers on how finance and trading work.</p>
      </div>
      <div className="notice rv"><b>Live headlines are not connected yet.</b> Once the Finnhub feed is on, the most important market stories appear here, balanced between positive and negative, and each one is removed after two weeks. Until then, this page shows our explainers.</div>
      <div className="sh rv"><h2 style={{ fontSize: 22 }}>Top stories</h2></div>
      <div className="ngrid">{ARTICLES.slice(0, 3).map((a) => <NewsCard key={a.id} {...a} tag={`${a.cat} · Explainer`} />)}</div>

      <div className="sh rv" style={{ marginTop: 56 }}>
        <h2 style={{ fontSize: 22 }}>Explainers</h2>
        <div className="chips" role="group" aria-label="Category">
          {CATS.map((c) => <button key={c} type="button" className="chip" aria-pressed={c === cat} onClick={() => setCat(c)}>{c}</button>)}
        </div>
      </div>
      <div className="ngrid">{list.map((a) => <NewsCard key={a.id} {...a} />)}</div>

      <div className="sh rv" style={{ marginTop: 56 }}><h2 style={{ fontSize: 22 }}>Words from investors</h2></div>
      <div className="qbox rv">
        <div id="qBody" className="qin" key={q} aria-live="off"><blockquote>{Q.q}</blockquote><p className="qa"><b>{Q.w}</b> · {Q.n}</p></div>
        <div className="qdots">{QUOTES.map((_, i) => <button key={i} type="button" aria-label={`Quote ${i + 1}`} aria-current={i === q} onClick={() => setQ(i)} />)}</div>
      </div>

      <div className="ctabox rv"><div><h2 style={{ fontSize: 26, marginBottom: 4 }}>Get the Sunday brief</h2><p>One email a week with the market-moving stories and a lesson at your level.</p></div><Link className="b solid lg" href="/brief">Join the brief <Arrow /></Link></div>
    </div>
  );
}

"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ARTICLES, CATS, QUOTES } from "@/lib/content";
import Vis from "@/components/Vis";

export function InsightCard({ id, cat, read, v, t, lede }: { id: string; cat: string; read: number; v: string; t: string; lede: string }) {
  return (
    <Link className="ncard rv" href={`/academy/insights/${id}`}>
      <Vis k={v} />
      <div className="tb"><span className="tcat">{cat}</span><h3>{t}</h3><p>{lede}</p><span className="meta">{read} min read</span></div>
    </Link>
  );
}

/** Insights: short plain-language explainers and words from investors. More will be added here over time. */
export default function Insights() {
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
    <section id="insights" aria-labelledby="insights-h">
      <div className="pg-h">
        <div className="eyebrow">Insights</div>
        <h1 id="insights-h" className="two fx">Understand it first. <span className="dim">Then study it.</span></h1>
        <p className="lede">Short, plain-language explainers on how finance and trading work, and words from great investors. A good place to start before the lessons.</p>
      </div>
      <div className="sh rv">
        <h2 style={{ fontSize: 22 }}>Explainers</h2>
        <div className="chips" role="group" aria-label="Category">
          {CATS.map((c) => <button key={c} type="button" className="chip" aria-pressed={c === cat} onClick={() => setCat(c)}>{c}</button>)}
        </div>
      </div>
      <div className="ngrid">{list.map((a) => <InsightCard key={a.id} {...a} />)}</div>
      <div className="sh rv" style={{ marginTop: 56 }}><h2 style={{ fontSize: 22 }}>Words from investors</h2></div>
      <div className="qbox rv">
        <div id="qBody" className="qin" key={q}><blockquote>{Q.q}</blockquote><p className="qa"><b>{Q.w}</b> · {Q.n}</p></div>
        <div className="qdots">{QUOTES.map((_, i) => <button key={i} type="button" aria-label={`Quote ${i + 1}`} aria-current={i === q} onClick={() => setQ(i)} />)}</div>
      </div>
    </section>
  );
}

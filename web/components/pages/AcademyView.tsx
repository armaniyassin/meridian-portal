"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { LEVELS, LESSONS } from "@/lib/academy";
import { toast } from "@/components/Toaster";
import { readDone } from "@/components/pages/progress";
import Insights from "@/components/pages/Insights";

const pad = (n: number) => String(n).padStart(2, "0");

/** Academy landing: three levels, the first free. Progress is kept in this browser only. */
export default function AcademyView() {
  const [lv, setLv] = useState(0);
  const [done, setDone] = useState<string[]>([]);
  useEffect(() => setDone(readDone()), []);
  const L = LEVELS[lv];
  const total = LESSONS.length, n = LESSONS.filter((l) => done.includes(l.slug)).length;
  return (
    <div className="wrap pg">
    <Insights />
    <div id="lessons" style={{ marginTop: 110 }} />
    <div className="split">
      <div className="sticky">
        <div className="eyebrow">Academy lessons</div>
        <h2 className="two fx" style={{ margin: "12px 0 14px" }}>Learn the way <span className="dim">professionals do.</span></h2>
        <p className="lede">Level-based reading lessons with a short quiz after each one, inspired by CFA-level curriculum. Level 1 is free.</p>
        <div role="group" aria-label="Levels" style={{ marginTop: 20, display: "grid", gap: 8 }}>
          {LEVELS.map((l, i) => (
            <button key={l.n} type="button" className="lvbtn" aria-pressed={i === lv} onClick={() => { setLv(i); if (!l.free) toast("Levels 2 and 3 need a Pro plan, which is coming soon."); }}>
              <div><b>{l.n}</b><span className="s">{l.lessons.length} lessons</span></div>
              <span className={`tag ${l.free ? "open" : "closed"}`}>{l.free ? "Free" : "Pro"}</span>
            </button>
          ))}
        </div>
        <p className="note" style={{ marginTop: 14 }}>Progress in Level 1: <span className="font-mono">{n} / {total}</span> lessons. Saved in this browser only.</p>
        <p className="note">Not affiliated with or endorsed by CFA Institute. Educational only, not investment advice.</p>
      </div>
      <div>
        <p className="rv" style={{ color: "var(--muted)", marginBottom: 14 }}>{L.blurb}</p>
        <div className="lessons">
          {L.free
            ? LESSONS.map((l, i) => (
                <Link key={l.slug} href={`/academy/${l.slug}`} className="lesson rv" style={{ textDecoration: "none", color: "inherit" }}>
                  <div className="l"><span className="i font-mono">{pad(i + 1)}</span><span>{l.title}</span></div>
                  <span className={`tag ${done.includes(l.slug) ? "open" : "closed"}`}>{done.includes(l.slug) ? "Done" : `${l.min} min · reading + quiz`}</span>
                </Link>
              ))
            : L.lessons.map((t, i) => (
                <div key={t} className="lesson lock"><div className="l"><span className="i font-mono">{pad(i + 1)}</span><span>{t}</span></div><span className="tag closed">Pro · locked</span></div>
              ))}
        </div>
      </div>
    </div></div>
  );
}

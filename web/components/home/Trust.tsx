"use client";
import { useRef, useState } from "react";

const ICONS: Record<string, string> = {
  shield: '<path d="M12 3l8 3v6c0 5-3.4 8-8 9-4.6-1-8-4-8-9V6l8-3z"/><path d="M8.5 12l2.5 2.5L15.5 10"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  scale: '<path d="M12 4v16M6 20h12M5 7h14"/><path d="M5 7l-3 7a3 3 0 0 0 6 0L5 7zM19 7l-3 7a3 3 0 0 0 6 0l-3-7z"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16 7l3 3"/>',
};
const TRUST = [
  { t: "Real data only", ic: "shield", d: "Every price, yield and ratio comes from FRED, FMP or Finnhub. If a feed fails, we show the last saved value with its date, never an estimate.", tags: ["FRED", "FMP", "Finnhub"] },
  { t: "Timestamped and cached", ic: "clock", d: "Each number carries its last updated time in UTC. Every request is cached so the data providers stay within their limits.", tags: ["UTC timestamps", "Cached"] },
  { t: "Educational, never advice", ic: "scale", d: "Sentiment reports and lessons are for learning and information. Nothing here is a recommendation to buy or sell.", tags: ["Not advice", "Compliance first"] },
  { t: "Privacy first", ic: "lock", d: "We ask for an email and a learning level only with your explicit consent, and every message has a one click unsubscribe.", tags: ["GDPR", "One click unsubscribe"] },
  { t: "Keys stay on the server", ic: "key", d: "Data keys and secrets never reach your browser. Every external call runs on our servers.", tags: ["Server side only", "Row level security"] },
];
const Chevron = ({ d }: { d: string }) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>;

/** Accordion of five trust points. Auto-advances every 6.5 s (the .bar animation), pauses on hover or focus, and is fully keyboard operable. */
export default function Trust() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const n = TRUST.length;
  return (
    <>
      <div ref={box} className={`tcards ${paused ? "paused" : ""}`} role="list" onPointerEnter={() => setPaused(true)} onPointerLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}
        onAnimationEnd={(e) => { if (e.animationName === "fill") setI((x) => (x + 1) % n); }}>
        {TRUST.map((c, k) => (
          <button key={c.t} type="button" role="listitem" className={`tc ${k === i ? "on" : ""}`} aria-expanded={k === i} onPointerOver={() => setI(k)} onClick={() => setI(k)}>
            <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" dangerouslySetInnerHTML={{ __html: ICONS[c.ic] }} />
            <div>
              <div className="tt">{c.t}</div>
              <div className="more-b"><hr /><p>{c.d}</p><div className="tags" style={{ marginTop: 12 }}>{c.tags.map((x) => <span key={x}>{x}</span>)}</div></div>
            </div>
            {k === i && <span className="bar" key={`b${i}`} />}
          </button>
        ))}
      </div>
      <div className="tarrows">
        <button type="button" aria-label="Previous point" onClick={() => setI((i + n - 1) % n)}><Chevron d="M15 6l-6 6 6 6" /></button>
        <button type="button" aria-label="Next point" onClick={() => setI((i + 1) % n)}><Chevron d="M9 6l6 6-6 6" /></button>
      </div>
    </>
  );
}

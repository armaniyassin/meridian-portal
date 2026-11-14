"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ARTICLES, TIPS } from "@/lib/content";
import Vis from "@/components/Vis";

const TIP_DELAY = 60000, POP_MS = 20000;
const pad = (n: number) => String(n).padStart(2, "0");
const ss = { get: (k: string) => { try { return sessionStorage.getItem(k); } catch { return null; } }, set: (k: string, v: string) => { try { sessionStorage.setItem(k, v); } catch { /* ignore */ } } };

/** Two gentle, dismissible pop-ups: a tip after one minute, and a reading list after a long scroll on the home page. Each shows once per visit and closes itself after 20 s. */
export default function Popups() {
  const path = usePathname();
  const quiet = path === "/brief" || path.startsWith("/news/");
  const [tip, setTip] = useState(false), [news, setNews] = useState(false);
  const [i, setI] = useState(0);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const root = useRef<HTMLDivElement>(null);

  const arm = useCallback((id: "tip" | "news", ms = POP_MS) => { clearTimeout(timers.current[id]); timers.current[id] = setTimeout(() => (id === "tip" ? setTip(false) : setNews(false)), ms); }, []);
  const hold = (id: "tip" | "news") => clearTimeout(timers.current[id]);

  useEffect(() => {
    if (quiet || ss.get("mgm-tip")) return;
    const fire = () => { if (ss.get("mgm-tip")) return; if (document.hidden) { const f = () => { if (!document.hidden) { document.removeEventListener("visibilitychange", f); fire(); } }; document.addEventListener("visibilitychange", f); return; } setNews(false); setTip(true); ss.set("mgm-tip", "1"); arm("tip"); };
    const t = setTimeout(fire, TIP_DELAY);
    return () => clearTimeout(t);
  }, [quiet, arm, path]);

  useEffect(() => {
    if (path !== "/") return;
    const open = () => { if (ss.get("mgm-news") || tip) return; setNews(true); ss.set("mgm-news", "1"); arm("news"); };
    const onScroll = () => { if ((scrollY + innerHeight) / document.documentElement.scrollHeight >= 0.74) open(); };
    addEventListener("scroll", onScroll, { passive: true }); addEventListener("mgm-tips-end", open);
    return () => { removeEventListener("scroll", onScroll); removeEventListener("mgm-tips-end", open); };
  }, [path, tip, arm]);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") { setTip(false); setNews(false); } };
    addEventListener("keydown", esc); return () => removeEventListener("keydown", esc);
  }, []);
  useEffect(() => { setTip(false); setNews(false); }, [path]);

  const T = TIPS[i];
  const stories = ARTICLES.slice(0, 3);
  return (
    <div ref={root}>
      <div className={`pop tippop ${tip ? "show" : ""}`} hidden={!tip} role="complementary" aria-label="A tip while you are here" onMouseEnter={() => hold("tip")} onFocus={() => hold("tip")} onMouseLeave={() => tip && arm("tip", 8000)} onBlur={() => tip && arm("tip", 8000)}>
        <button className="x" type="button" aria-label="Close tip" onClick={() => setTip(false)}>×</button>
        <div className="ph"><span className="tcat">A tip while you are here · {pad(i + 1)} of {TIPS.length}</span></div>
        <Vis k={T.v} className="pv" />
        <h4>{T.t}</h4><p>{T.d}</p>
        <div className="prow">
          <div className="pnav">
            <button type="button" aria-label="Previous tip" onClick={() => setI((i + TIPS.length - 1) % TIPS.length)}>‹</button>
            <button type="button" aria-label="Next tip" onClick={() => setI((i + 1) % TIPS.length)}>›</button>
          </div>
          {T.a && <Link className="plink" href={`/news/${T.a}`} onClick={() => setTip(false)}>Read more</Link>}
          <Link className="b solid sm" href="/brief" onClick={() => setTip(false)}>Join the brief</Link>
        </div>
      </div>

      <div className={`pop newspop ${news ? "show" : ""}`} hidden={!news} role="complementary" aria-label="Worth reading" onMouseEnter={() => hold("news")} onFocus={() => hold("news")} onMouseLeave={() => news && arm("news", 8000)} onBlur={() => news && arm("news", 8000)}>
        <button className="x" type="button" aria-label="Close" onClick={() => setNews(false)}>×</button>
        <div className="ph"><span className="tcat">Worth reading</span></div>
        {stories.map((a) => (
          <Link key={a.id} className="nitem" href={`/news/${a.id}`} onClick={() => setNews(false)}><span className="tcat">{a.cat} · Explainer</span><b>{a.t}</b></Link>
        ))}
        <div className="prow"><Link className="b solid sm" href="/news" onClick={() => setNews(false)}>Open the news page</Link><Link className="plink" href="/brief" onClick={() => setNews(false)}>Join the brief</Link></div>
      </div>
    </div>
  );
}

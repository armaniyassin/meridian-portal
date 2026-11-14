"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const MAIN = [["/markets", "Markets"], ["/sentiment", "Sentiment"], ["/academy", "Academy"], ["/news", "News"]] as const;

export default function NavLinks() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    const away = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("click", away); document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("click", away); document.removeEventListener("keydown", esc); };
  }, []);

  return (
    <nav className="nav" id="nav" aria-label="Main">
      {MAIN.map(([href, name]) => (
        <Link key={href} href={href} aria-current={path.startsWith(href) ? "page" : undefined}>{name}</Link>
      ))}
      <div className={`more ${open ? "open" : ""}`} ref={box}>
        <button className="moreb" type="button" aria-expanded={open} aria-haspopup="true" onClick={() => setOpen((o) => !o)}>
          More
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
        </button>
        <div className="mm" role="menu">
          <Link href="/brief" role="menuitem">Weekly brief<small>A Sunday macro summary at your level.</small></Link>
          <Link href="/#disclosures" role="menuitem">Disclosures<small>What this site is and what it is not.</small></Link>
        </div>
      </div>
    </nav>
  );
}

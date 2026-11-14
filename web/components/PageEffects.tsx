"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Scroll effects from the prototype: reveal on scroll (.rv), focus blur on headlines (.fx), header hides while scrolling down.
 *  All of it is skipped when the visitor prefers reduced motion. */
export default function PageEffects() {
  const path = usePathname();
  useEffect(() => {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hdr = document.getElementById("hdr");
    let lastY = scrollY;
    const els = [...document.querySelectorAll<HTMLElement>(".rv")];
    let io: IntersectionObserver | null = null;
    if (!reduce && "IntersectionObserver" in window) {
      io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io?.unobserve(e.target); } }), { threshold: 0.12 });
      els.forEach((el) => { el.classList.add("pre"); io!.observe(el); });
    }
    const fx = () => {
      if (reduce) return;
      const vh = innerHeight;
      document.querySelectorAll<HTMLElement>(".fx").forEach((el) => {
        const r = el.getBoundingClientRect(), d = Math.abs(r.top + r.height / 2 - vh * 0.5) / (vh * 0.5);
        const a = Math.max(0.18, Math.min(1, 1 - (d - 0.6) * 1.3)), bl = Math.max(0, Math.min(7, (d - 0.65) * 9));
        el.style.opacity = a.toFixed(3); el.style.filter = bl > 0.2 ? `blur(${bl.toFixed(1)}px)` : "none";
      });
    };
    const onScroll = () => {
      const y = scrollY, dy = y - lastY;
      hdr?.classList.toggle("scrolled", y > 24);
      if (y < 80) hdr?.classList.remove("hide");
      else if (dy > 6 && !document.querySelector(".more.open")) hdr?.classList.add("hide");
      else if (dy < -6) hdr?.classList.remove("hide");
      if (Math.abs(dy) > 6 || y < 80) lastY = y;
      fx();
    };
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => { removeEventListener("scroll", onScroll); io?.disconnect(); document.querySelectorAll(".fx").forEach((el) => { (el as HTMLElement).style.opacity = ""; (el as HTMLElement).style.filter = ""; }); };
  }, [path]);
  return null;
}

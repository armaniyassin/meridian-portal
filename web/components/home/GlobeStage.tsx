"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { HUBS, HUBS_BY_ID, nextChange, humanMinutes } from "@/lib/hubs";

declare global { interface Window { __pal?: () => unknown } }
type GlobeLike = { active: string | null; focus: (lon: number, lat: number) => void; frame: (t: number) => void };

const isDark = () => {
  const t = document.documentElement.dataset.theme;
  return t ? t === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
};
const palette = () => isDark()
  ? { l: [226, 234, 246], n: [112, 138, 176], s: "150,176,214", limb1: "rgba(110,150,210,.14)", limb2: "rgba(150,185,235,.28)", labBg: "rgba(17,27,41,.92)", labLine: "#35506f", labFg: "#e8edf3" }
  : { l: [38, 62, 100], n: [160, 172, 190], s: "80,100,130", limb1: "rgba(61,111,180,.06)", limb2: "rgba(61,111,180,.2)", labBg: "rgba(255,254,251,.96)", labLine: "#d6d2c6", labFg: "#1f2d3d" };

export default function GlobeStage() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const globe = useRef<GlobeLike | null>(null);
  const [current, setCurrent] = useState("lon");
  const [now, setNow] = useState<number | null>(null);

  const select = useCallback((id: string, focus = true) => {
    setCurrent(id);
    const g = globe.current, h = HUBS_BY_ID[id];
    if (g && h) { g.active = id; if (focus) g.focus(h.lon, h.lat); }
  }, []);

  useEffect(() => {
    let raf = 0, alive = true;
    (async () => {
      const { Globe, RAD } = await import("@/lib/globe/globe");
      if (!alive || !canvas.current) return;
      window.__pal = palette;
      const lonHome = Math.max(-170, Math.min(170, -new Date().getTimezoneOffset() / 4));
      const g = new Globe(canvas.current, {
        interactive: true, markers: true, auto: 0.0014, yaw: lonHome * RAD, pitch: 0.3, cx: 0.5,
        R: (w: number, h: number) => Math.min(w * 0.3, h * 0.37, 360),
        cyPx: (_R: number, _w: number, h: number) => h * 0.52,
        fp: (lat: number) => Math.max(-0.9, Math.min(0.9, lat * RAD * 0.8)),
        onPick: (h: { id: string }) => select(h.id),
      });
      g.active = "lon";
      globe.current = g;
      const loop = () => { g.frame(Date.now()); raf = requestAnimationFrame(loop); };
      raf = requestAnimationFrame(loop);
    })();
    return () => { alive = false; cancelAnimationFrame(raf); };
  }, [select]);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest("input,textarea,select,[contenteditable]")) return;
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      const i = HUBS.findIndex((h) => h.id === current), d = e.key === "ArrowLeft" ? -1 : 1;
      select(HUBS[(i + d + HUBS.length) % HUBS.length].id);
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [current, select]);

  const step = (d: number) => { const i = HUBS.findIndex((h) => h.id === current); select(HUBS[(i + d + HUBS.length) % HUBS.length].id); };
  const hub = HUBS_BY_ID[current];
  const nc = now ? nextChange(hub, now) : null;

  return (
    <>
      <div className="gcanvas">
        <canvas ref={canvas} role="img" aria-label="Interactive globe of eleven financial centres. Drag to rotate, or select a marker to see its status." />
      </div>
      <div className="hubbar">
        <div className="hubnav" aria-live="polite">
          <button type="button" aria-label="Previous centre" onClick={() => step(-1)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
          </button>
          <div className="info">
            <b style={{ fontWeight: 600 }}>{hub.name}</b>
            <span style={{ color: "var(--muted)" }}>{hub.ex}</span>
            {nc && (
              <span className={`tag ${nc.open ? "open" : "closed"}`}>
                {nc.open ? "Open" : "Closed"}{nc.mins != null ? ` · ${nc.open ? "closes" : "opens"} in ${humanMinutes(nc.mins)}` : ""}
              </span>
            )}
          </div>
          <button type="button" aria-label="Next centre" onClick={() => step(1)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
          </button>
        </div>
      </div>
      <p className="hint">Drag to rotate. Select a marker or use the arrow keys to change centre.</p>
    </>
  );
}

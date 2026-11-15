"use client";
import { useEffect, useRef } from "react";
import type { PeriodKey } from "@/lib/periods";

const INTERVAL: Record<PeriodKey, string> = { "1D": "5", "1W": "60", "1M": "D", "1Y": "D", "5Y": "W" };
const RANGE: Record<PeriodKey, string> = { "1D": "1D", "1W": "5D", "1M": "1M", "1Y": "12M", "5Y": "60M" };

/** Free TradingView "Advanced Chart" widget: all intraday periods, no data-plan quota on our side, TradingView branding stays visible (their terms).
 *  It is third-party content, so it is only mounted after the visitor clicks to load it. */
export default function TradingViewChart({ symbol, period, label }: { symbol: string; period: PeriodKey; label: string }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const box = host.current; if (!box) return;
    const cs = getComputedStyle(document.documentElement), bg = cs.getPropertyValue("--bg").trim(), surf = cs.getPropertyValue("--surface").trim(), up = cs.getPropertyValue("--up").trim() || "#10b981", down = cs.getPropertyValue("--down").trim() || "#f43f5e";
    const m = /^#?([0-9a-f]{6})$/i.exec(bg), n = m ? parseInt(m[1], 16) : 0;
    const lum = ((n >> 16) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114) / 255;
    box.innerHTML = "";
    const inner = document.createElement("div"); inner.className = "tradingview-widget-container__widget"; inner.style.cssText = "height:100%;width:100%";
    const s = document.createElement("script");
    s.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js"; s.async = true;
    s.text = JSON.stringify({
      autosize: true, symbol, interval: INTERVAL[period], range: RANGE[period], timezone: "Etc/UTC", theme: lum < 0.5 ? "dark" : "light", style: "1", locale: "en",
      // match the site: our own surface colour, a faint grid, no toolbars (the period buttons above drive the chart), no symbol picker, no volume pane
      backgroundColor: surf || (lum < 0.5 ? "#0f172a" : "#ffffff"), gridColor: lum < 0.5 ? "rgba(148,163,184,0.10)" : "rgba(15,23,42,0.06)",
      hide_top_toolbar: true, hide_side_toolbar: true, hide_legend: false, hide_volume: true, withdateranges: false, allow_symbol_change: false, save_image: false, calendar: false,
      overrides: { "mainSeriesProperties.candleStyle.upColor": up, "mainSeriesProperties.candleStyle.borderUpColor": up, "mainSeriesProperties.candleStyle.wickUpColor": up, "mainSeriesProperties.candleStyle.downColor": down, "mainSeriesProperties.candleStyle.borderDownColor": down, "mainSeriesProperties.candleStyle.wickDownColor": down },
      support_host: "https://www.tradingview.com",
    });
    box.append(inner, s);
    return () => { box.innerHTML = ""; };
  }, [symbol, period]);
  return (
    <div>
      <div ref={host} className="tradingview-widget-container tv-host" role="region" aria-label={`${label} interactive chart from TradingView`} />
      <p className="note dg-foot">Chart by <a className="underline" href="https://www.tradingview.com/" target="_blank" rel="noopener noreferrer">TradingView</a>. Data may be delayed. Chart data is provided by TradingView, not by us.</p>
    </div>
  );
}

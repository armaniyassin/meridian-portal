export type Hub = {
  id: string; key?: number; off?: string[]; name: string; ex: string; lat: number; lon: number; tz: string;
  o: number; c: number; /* regular session, local minutes since midnight */
  idx: string; bond: string; bsrc: string; fx: string;
};

// Real places and real regular-session hours in local time. Holidays are not included.
export const HUBS: Hub[] = [
 {id:'nyc', key:1, name:'New York', ex:'NYSE · Nasdaq', lat:40.71, lon:-74.0, tz:'America/New_York', o:570, c:960, idx:'S&P 500', bond:'US 10-year Treasury', bsrc:'FRED DGS10', fx:'EUR/USD'},
 {id:'tor', name:'Toronto', ex:'TSX', lat:43.65, lon:-79.38, tz:'America/Toronto', o:570, c:960, idx:'S&P/TSX Composite', bond:'Canada 10-year', bsrc:'FMP', fx:'USD/CAD'},
 {id:'sao', name:'São Paulo', ex:'B3', lat:-23.55, lon:-46.63, tz:'America/Sao_Paulo', o:600, c:1020, idx:'Ibovespa', bond:'Brazil 10-year', bsrc:'FMP', fx:'USD/BRL'},
 {id:'lon', key:1, name:'London', ex:'LSE', lat:51.51, lon:-0.13, tz:'Europe/London', o:480, c:990, idx:'FTSE 100', bond:'UK 10-year gilt', bsrc:'FMP', fx:'GBP/USD'},
 {id:'fra', key:1, name:'Frankfurt', ex:'Xetra', lat:50.11, lon:8.68, tz:'Europe/Berlin', o:540, c:1050, idx:'DAX', bond:'Germany 10-year Bund', bsrc:'FMP', fx:'EUR/USD'},
 {id:'mad', name:'Madrid', ex:'BME', lat:40.42, lon:-3.70, tz:'Europe/Madrid', o:540, c:1050, idx:'IBEX 35', bond:'Spain 10-year', bsrc:'FMP', fx:'EUR/USD'},
 {id:'mum', name:'Mumbai', ex:'NSE · BSE', lat:19.08, lon:72.88, tz:'Asia/Kolkata', o:555, c:930, idx:'Nifty 50', bond:'India 10-year', bsrc:'FMP', fx:'USD/INR'},
 {id:'hkg', key:1, name:'Hong Kong', ex:'HKEX', lat:22.32, lon:114.17, tz:'Asia/Hong_Kong', o:570, c:960, idx:'Hang Seng', bond:'Not covered', bsrc:'', fx:'USD/HKD'},
 {id:'sha', key:1, name:'Shanghai', ex:'SSE', lat:31.23, lon:121.47, tz:'Asia/Shanghai', o:570, c:900, idx:'SSE Composite', bond:'China 10-year', bsrc:'FMP', fx:'USD/CNY'},
 {id:'tyo', key:1, name:'Tokyo', ex:'TSE', lat:35.68, lon:139.69, tz:'Asia/Tokyo', o:540, c:930, idx:'Nikkei 225', bond:'Japan 10-year JGB', bsrc:'FMP', fx:'USD/JPY'},
 {id:'syd', name:'Sydney', ex:'ASX', lat:-33.87, lon:151.21, tz:'Australia/Sydney', o:600, c:960, idx:'ASX 200', bond:'Australia 10-year', bsrc:'FMP', fx:'AUD/USD'},
 {id:'jnb', key:1, name:'Johannesburg', ex:'JSE', lat:-26.20, lon:28.05, tz:'Africa/Johannesburg', o:540, c:1020, idx:'JSE Top 40', bond:'South Africa 10-year', bsrc:'FMP', fx:'USD/ZAR'},
 {id:'cai', key:1, off:['Fri','Sat'], name:'Cairo', ex:'EGX', lat:30.04, lon:31.24, tz:'Africa/Cairo', o:600, c:870, idx:'EGX 30', bond:'Not covered', bsrc:'', fx:'USD/EGP'},
 {id:'los', key:1, name:'Lagos', ex:'NGX', lat:6.52, lon:3.38, tz:'Africa/Lagos', o:570, c:870, idx:'NGX All-Share', bond:'Not covered', bsrc:'', fx:'USD/NGN'},
 {id:'nbo', key:1, name:'Nairobi', ex:'NSE', lat:-1.29, lon:36.82, tz:'Africa/Nairobi', o:540, c:900, idx:'NSE 20', bond:'Not covered', bsrc:'', fx:'USD/KES'},
];

export const HUBS_BY_ID: Record<string, Hub> = Object.fromEntries(HUBS.map((h) => [h.id, h]));

const fmtCache: Record<string, Intl.DateTimeFormat> = {};
function parts(tz: string, t: number) {
  const f = fmtCache[tz] ?? (fmtCache[tz] = new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", weekday: "short", hourCycle: "h23" }));
  const p: Record<string, string> = {};
  f.formatToParts(new Date(t)).forEach((x) => (p[x.type] = x.value));
  return { wd: p.weekday, min: +p.hour * 60 + +p.minute };
}

export function isOpen(h: Hub, t: number): boolean {
  const p = parts(h.tz, t);
  if ((h.off ?? ["Sat", "Sun"]).includes(p.wd)) return false;
  return p.min >= h.o && p.min < h.c;
}

export const openCount = (t: number) => HUBS.reduce((n, h) => n + (isOpen(h, t) ? 1 : 0), 0);

/** Minutes until the status flips (5-minute scan, then 1-minute refinement). */
export function nextChange(h: Hub, t0: number): { open: boolean; mins: number | null; at: number | null } {
  const t = Math.floor(t0 / 60000) * 60000, s = isOpen(h, t);
  for (let m = 5; m <= 60 * 24 * 5; m += 5) {
    if (isOpen(h, t + m * 60000) !== s) {
      for (let k = m - 4; k <= m; k++) if (isOpen(h, t + k * 60000) !== s) return { open: s, mins: k, at: t + k * 60000 };
      return { open: s, mins: m, at: t + m * 60000 };
    }
  }
  return { open: s, mins: null, at: null };
}

export function humanMinutes(m: number | null): string {
  if (m == null) return "";
  const d = Math.floor(m / 1440), hh = Math.floor((m % 1440) / 60), mm = m % 60;
  return ((d ? d + "d " : "") + (hh ? hh + "h " : "") + (!d ? mm + "m" : "")).trim();
}
export const pad = (n: number) => String(n).padStart(2, "0");

export const REGIONS = ["Americas", "Europe", "Africa", "Asia-Pacific"] as const;
export const regionOf = (h: Hub): string => (h.tz.startsWith("America") ? "Americas" : h.tz.startsWith("Europe") ? "Europe" : h.tz.startsWith("Africa") ? "Africa" : "Asia-Pacific");
const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty"];
/** Number of centres in words, so copy never goes stale when a hub is added. */
export const HUB_COUNT_WORD = WORDS[HUBS.length] ?? String(HUBS.length);

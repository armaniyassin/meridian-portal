import { HUBS, isOpen } from "@/lib/hubs";

export type Range = "day" | "week";
export type Zone = "utc" | "local";
export type Series = { vals: number[]; desc: string[]; axis: string[]; nowIdx: number; sub: string };

const dfmt = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
const pad = (n: number) => String(n).padStart(2, "0");
const openCount = (t: number) => HUBS.reduce((n, h) => n + (isOpen(h, t) ? 1 : 0), 0);

/** Weekends roll forward to the next trading day. */
function refDay(now: number) {
  const n = new Date(now), d = Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate()), wd = new Date(d).getUTCDay();
  const sh = wd === 6 ? 2 : wd === 0 ? 1 : 0;
  return { t: d + sh * 86400000, shifted: sh };
}

/** Exchanges open by hour (or exchange-hours per day). Computed from published sessions, not prices. */
export function sessionSeries(now: number, range: Range, zone: Zone): Series {
  const out: Series = { vals: [], desc: [], axis: [], nowIdx: -1, sub: "" };
  if (range === "day") {
    const { t: base, shifted } = refDay(now);
    const off = zone === "local" ? -new Date().getTimezoneOffset() * 60000 : 0;
    for (let h = 0; h < 24; h++) {
      const n = openCount(base + h * 3600000 + 1800000 - off);
      out.vals.push(n);
      out.desc.push(`${pad(h)}:00 ${zone === "utc" ? "UTC" : "local"}: ${n} of ${HUBS.length} exchanges open`);
    }
    if (!shifted) out.nowIdx = new Date(now + off).getUTCHours();
    out.axis = ["00:00", "06:00", "12:00", "18:00", "23:00"];
    out.sub = (shifted ? "Next trading day, " : "Today, ") + dfmt.format(new Date(base)) + " · " + (zone === "utc" ? "UTC" : "your local time");
  } else {
    const n0 = new Date(now), st = Date.UTC(n0.getUTCFullYear(), n0.getUTCMonth(), n0.getUTCDate());
    for (let i = 0; i < 7; i++) {
      let tot = 0;
      for (let m = 0; m < 1440; m += 30) tot += openCount(st + i * 86400000 + m * 60000) * 0.5;
      tot = Math.round(tot);
      const day = dfmt.format(new Date(st + i * 86400000));
      out.vals.push(tot); out.desc.push(`${day}: ${tot} exchange-hours of trading`); out.axis.push(day.split(" ")[0]);
    }
    out.nowIdx = 0; out.sub = "Next 7 days, summed over eleven exchanges (UTC days)";
  }
  return out;
}

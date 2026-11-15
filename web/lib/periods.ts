/** Shared by server routes and client components (no server-only import here). */
export const PERIODS = [["1D", "1 day"], ["1W", "1 week"], ["1M", "1 month"], ["1Y", "1 year"], ["5Y", "5 years"]] as const;
export type PeriodKey = (typeof PERIODS)[number][0];
export type Perf = Partial<Record<PeriodKey, number | null>>;
/** One price bar: [time in ms (UTC), open, high, low, close, volume]. Open/high/low/volume are null for series that only have a close (bond yields). */
export type Bar = [number, number | null, number | null, number | null, number, number | null];
/** Smallest scale for the bar graphics, so a 5-year move and a 1-day move can both be drawn without the bar overflowing. */
export const P_FLOOR: Record<PeriodKey, number> = { "1D": 3, "1W": 5, "1M": 10, "1Y": 40, "5Y": 100 };
export type Kind = "index" | "fx" | "commodity" | "stock" | "bond";

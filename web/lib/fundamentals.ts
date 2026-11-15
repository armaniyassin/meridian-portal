import "server-only";
import { getOrFetch, type Cached } from "@/lib/cache";

export type Fund = Record<string, number | string | null>;
type Obj = Record<string, unknown> | null;

async function fmpOne(path: string, symbol: string, extra = ""): Promise<Obj> {
  const key = process.env.FMP_API_KEY;
  if (!key) throw new Error("FMP_API_KEY missing");
  const res = await fetch(`https://financialmodelingprep.com/stable/${path}?symbol=${encodeURIComponent(symbol)}${extra}&apikey=${key}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`FMP ${path} ${symbol} HTTP ${res.status}`);
  const arr = (await res.json()) as Record<string, unknown>[];
  return Array.isArray(arr) && arr[0] ? arr[0] : null;
}

/** Fundamentals from FMP ratios-ttm, key-metrics-ttm and the latest income statement (3 requests per ticker, cached 24 h).
 *  Each figure is taken from the first field that holds a number; anything missing stays null and shows as a dash. Nothing is calculated from guesses. */
async function fetchFund(symbol: string): Promise<Fund> {
  const parts: Obj[] = [];
  let ok = 0, lastErr: unknown = null;
  for (const [path, extra] of [["ratios-ttm", ""], ["key-metrics-ttm", ""], ["income-statement", "&limit=1"]] as const) {
    try { parts.push(await fmpOne(path, symbol, extra)); ok++; } catch (e) { parts.push(null); lastErr = e; }
  }
  if (!ok) throw lastErr instanceof Error ? lastErr : new Error(`FMP fundamentals ${symbol} failed`);
  const [r, k, inc] = parts;
  const g = (names: string[], scale = 1): number | null => {
    for (const o of [r, k, inc]) for (const n of names) { const v = o?.[n]; if (typeof v === "number" && isFinite(v)) return v * scale; }
    return null;
  };
  return {
    pe: g(["priceToEarningsRatioTTM"]), pb: g(["priceToBookRatioTTM"]), ps: g(["priceToSalesRatioTTM"]), pcf: g(["priceToOperatingCashFlowRatioTTM"]),
    evebitda: g(["evToEBITDATTM", "enterpriseValueMultipleTTM"]), eps: g(["netIncomePerShareTTM"]),
    divyield: g(["dividendYieldTTM"], 100), payout: g(["dividendPayoutRatioTTM"], 100), mcap: g(["marketCap"]), ebitda: g(["ebitda"]),
    gmargin: g(["grossProfitMarginTTM"], 100), omargin: g(["operatingProfitMarginTTM"], 100), ebitdamargin: g(["ebitdaMarginTTM"], 100), nmargin: g(["netProfitMarginTTM"], 100),
    roa: g(["returnOnAssetsTTM"], 100), roe: g(["returnOnEquityTTM"], 100), roce: g(["returnOnCapitalEmployedTTM"], 100),
    current: g(["currentRatioTTM"]), quick: g(["quickRatioTTM"]), cashratio: g(["cashRatioTTM"]),
    de: g(["debtToEquityRatioTTM"]), ltde: g(["longTermDebtToEquityRatioTTM"]), debtratio: g(["debtToAssetsRatioTTM"]), fleverage: g(["financialLeverageRatioTTM"]), intcov: g(["interestCoverageRatioTTM"]),
    invturn: g(["inventoryTurnoverTTM"]), dio: g(["daysOfInventoryOutstandingTTM"]), recturn: g(["receivablesTurnoverTTM"]), dso: g(["daysOfSalesOutstandingTTM"]),
    payturn: g(["payablesTurnoverTTM"]), dpo: g(["daysOfPayablesOutstandingTTM"]), ccc: g(["cashConversionCycleTTM"]), atoturn: g(["assetTurnoverTTM"]), fatoturn: g(["fixedAssetTurnoverTTM"]),
    cfrev: g(["operatingCashFlowSalesRatioTTM"], 100), fcff: g(["freeCashFlowToFirmTTM"]), fcfe: g(["freeCashFlowToEquityTTM"]), cfps: g(["operatingCashFlowPerShareTTM"]), debtcov: g(["operatingCashFlowCoverageRatioTTM"]),
    asof: typeof inc?.date === "string" ? `Latest income statement: ${inc.date}` : "",
  };
}
export const getFundamentals = (symbol: string): Promise<Cached<Fund>> => getOrFetch(`fmp:fund:${symbol}`, 24 * 3600, () => fetchFund(symbol));

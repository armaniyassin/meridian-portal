/** Metric groups follow the CFA Level I curriculum: financial statement analysis (ratio families, DuPont, cash flow) and fixed income
 *  (yield, duration, convexity). Entry: [key, label, format, how it is calculated, what it tells you]. */
export type Fmt = "x" | "pct" | "n2" | "n4" | "d1" | "cur" | "bp" | "yr" | "txt";
export type Metric = [key: string, label: string, fmt: Fmt, how: string, what: string];
export type Group = [title: string, metrics: Metric[]];

export const STOCK_GROUPS: Group[] = [
  ["Valuation", [
    ["pe", "P/E", "x", "Price ÷ earnings per share", "What investors pay for each unit of earnings"],
    ["pb", "P/B", "x", "Price ÷ book value per share", "Price against net assets"],
    ["ps", "P/S", "x", "Price ÷ sales per share", "Price against revenue"],
    ["pcf", "P/CF", "x", "Price ÷ operating cash flow per share", "Price against cash from operations"],
    ["evebitda", "EV/EBITDA", "x", "Enterprise value ÷ EBITDA", "Whole-business value against operating earnings"],
    ["eps", "EPS", "n2", "Net income to common ÷ shares", "Earnings per share"],
    ["divyield", "Dividend yield", "pct", "Dividends per share ÷ price", "Cash paid out against price"],
    ["payout", "Payout ratio", "pct", "Dividends ÷ net income", "Share of earnings paid out"],
    ["mcap", "Market cap", "cur", "Share price × shares outstanding", "Size of the company"],
    ["ebitda", "EBITDA", "cur", "Earnings before interest, tax, depreciation and amortisation", "Operating earnings before financing and non-cash charges"],
  ]],
  ["Profitability", [
    ["gmargin", "Gross margin", "pct", "Gross profit ÷ revenue", "Profit left after direct costs"],
    ["omargin", "Operating margin", "pct", "Operating income ÷ revenue", "Profit from operations"],
    ["ebitdamargin", "EBITDA margin", "pct", "EBITDA ÷ revenue", "Operating profit before depreciation"],
    ["nmargin", "Net margin", "pct", "Net income ÷ revenue", "Profit left after everything"],
    ["roa", "ROA", "pct", "Net income ÷ average total assets", "Profit per unit of assets"],
    ["roe", "ROE", "pct", "Net income ÷ average equity", "Profit per unit of owners’ capital"],
    ["roce", "Return on capital employed", "pct", "EBIT ÷ (total assets − current liabilities)", "Operating return on the capital in use"],
  ]],
  ["Liquidity", [
    ["current", "Current ratio", "x", "Current assets ÷ current liabilities", "Ability to meet obligations due within a year"],
    ["quick", "Quick ratio", "x", "(Cash + securities + receivables) ÷ current liabilities", "The same test without inventory"],
    ["cashratio", "Cash ratio", "x", "(Cash + securities) ÷ current liabilities", "Strictest liquidity test"],
  ]],
  ["Solvency", [
    ["de", "Debt-to-equity", "x", "Total debt ÷ total equity", "Financial leverage and risk"],
    ["ltde", "Long-term debt-to-equity", "x", "Long-term debt ÷ total equity", "Long-dated leverage"],
    ["debtratio", "Total debt ratio", "x", "Total debt ÷ total assets", "Share of assets financed by debt"],
    ["fleverage", "Financial leverage", "x", "Total assets ÷ total equity", "Assets supported by each unit of equity"],
    ["intcov", "Interest coverage", "x", "EBIT ÷ interest expense", "Ability to pay interest from operating profit"],
  ]],
  ["Activity", [
    ["invturn", "Inventory turnover", "x", "Cost of goods sold ÷ average inventory", "How fast stock is sold"],
    ["dio", "Days of inventory", "d1", "365 ÷ inventory turnover", "Days stock sits before sale"],
    ["recturn", "Receivables turnover", "x", "Revenue ÷ average receivables", "How fast customers pay"],
    ["dso", "Days sales outstanding", "d1", "365 ÷ receivables turnover", "Days to collect"],
    ["payturn", "Payables turnover", "x", "Purchases ÷ average payables", "How fast suppliers are paid"],
    ["dpo", "Days payables", "d1", "365 ÷ payables turnover", "Days taken to pay"],
    ["ccc", "Cash conversion cycle", "d1", "Days inventory + days sales − days payables", "Days cash is tied up in operations"],
    ["atoturn", "Total asset turnover", "x", "Revenue ÷ average total assets", "Revenue per unit of assets"],
    ["fatoturn", "Fixed asset turnover", "x", "Revenue ÷ average net fixed assets", "Revenue per unit of fixed assets"],
  ]],
  ["Cash flow", [
    ["cfrev", "Cash flow to revenue", "pct", "Operating cash flow ÷ revenue", "Cash generated per unit of revenue"],
    ["fcff", "Free cash flow to the firm", "cur", "CFO + interest × (1 − tax) − capex", "Cash available to all capital providers"],
    ["fcfe", "Free cash flow to equity", "cur", "CFO − capex + net borrowing", "Cash available to shareholders"],
    ["cfps", "Cash flow per share", "n2", "Operating cash flow ÷ shares", "Operating cash per share"],
    ["debtcov", "Debt coverage", "x", "CFO ÷ total debt", "Ability to repay debt from operations"],
  ]],
  ["DuPont breakdown of ROE", [
    ["nmargin", "Net margin", "pct", "Net income ÷ revenue", "Profitability"],
    ["atoturn", "× Asset turnover", "x", "Revenue ÷ average total assets", "Efficiency"],
    ["fleverage", "× Financial leverage", "x", "Total assets ÷ equity", "Leverage"],
    ["roe", "= ROE", "pct", "Margin × turnover × leverage", "Return to owners"],
  ]],
];

/** Bonds: yield measures and interest-rate risk, calculated for a par bond at today's yield. */
export const BOND_GROUPS: Group[] = [
  ["Yield", [
    ["ytm", "Yield to maturity", "pct", "Rate that discounts all cash flows to the price", "Return if held to maturity"],
    ["cy", "Current yield", "pct", "Annual coupon ÷ price", "Income against price"],
    ["coupon", "Coupon (par bond)", "pct", "Assumed equal to the yield", "Interest paid on face value"],
    ["price", "Price (par bond)", "n2", "Present value of all cash flows", "100 means trading at face value"],
  ]],
  ["Interest-rate risk", [
    ["macdur", "Macaulay duration", "yr", "Weighted average time to receive cash flows", "Years to recover the price"],
    ["moddur", "Modified duration", "n2", "Macaulay duration ÷ (1 + yield per period)", "About % price change for a 1% yield move"],
    ["effdur", "Effective duration", "n2", "Equal to modified duration for a bond with no options", "Duration using curve shifts"],
    ["moneydur", "Money duration", "n2", "Modified duration × price", "Price change per 100 face value for a 1% move"],
    ["pvbp", "Price value of a basis point", "n4", "Modified duration × price × 0.0001", "Price change for a 1 bp yield move"],
    ["convexity", "Convexity", "n2", "Curvature of the price–yield relationship", "Corrects duration for large yield moves"],
  ]],
];

/** Index, currency and commodity: range and performance worked out from real daily history. */
export const RANGE_GROUPS: Group[] = [
  ["Range and performance", [
    ["last", "Last", "n2", "Latest close", "Most recent level"],
    ["dayhi", "Day high", "n2", "Highest level in the latest session", "Top of the day"],
    ["daylo", "Day low", "n2", "Lowest level in the latest session", "Bottom of the day"],
    ["hi52", "52-week high", "n2", "Highest level in the last year", "Top of the yearly range"],
    ["lo52", "52-week low", "n2", "Lowest level in the last year", "Bottom of the yearly range"],
    ["ytd", "Year to date", "pct", "Change since the last close of the previous year", "Return so far this year"],
    ["y1", "1-year change", "pct", "Last close against one year ago", "Twelve-month move"],
    ["y5", "5-year change", "pct", "Last close against five years ago", "Long-run move"],
  ]],
];

const compact = (v: number) => { const a = Math.abs(v); return a >= 1e12 ? `${(v / 1e12).toFixed(2)}T` : a >= 1e9 ? `${(v / 1e9).toFixed(2)}B` : a >= 1e6 ? `${(v / 1e6).toFixed(2)}M` : v.toLocaleString("en-US", { maximumFractionDigits: 2 }); };
export function fmtMetric(fmt: Fmt, v: number | string | null | undefined, dec = 2): string {
  if (v == null || v === "") return "—";
  if (fmt === "txt") return String(v);
  if (typeof v !== "number" || !isFinite(v)) return "—";
  switch (fmt) {
    case "x": return `${v.toFixed(2)}x`; case "pct": return `${v.toFixed(2)}%`; case "n2": return v.toFixed(dec); case "n4": return v.toFixed(4);
    case "d1": return `${v.toFixed(1)} days`; case "cur": return compact(v); case "bp": return `${v.toFixed(0)} bp`; case "yr": return `${v.toFixed(2)} yrs`;
  }
}

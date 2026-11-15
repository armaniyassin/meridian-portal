/** Maps our data-provider symbols to TradingView symbols. Client-safe (no secrets). Only pairs we are confident about are listed:
 *  anything missing simply does not offer the TradingView chart, so we never open the wrong instrument. Verify new entries in the widget before adding. */
const MAP: Record<string, string> = {
  // indices (OANDA index CFDs: the free widget opens these reliably; futures and some cash-index codes made it fall back to another symbol)
  "^GSPC": "OANDA:SPX500USD", "^DJI": "OANDA:US30USD", "^FTSE": "OANDA:UK100GBP", "^STOXX50E": "OANDA:EU50EUR",
  "^GDAXI": "OANDA:DE30EUR", "^FCHI": "OANDA:FR40EUR", "^N225": "OANDA:JP225USD", "^HSI": "OANDA:HK33HKD",
  // currencies
  EURUSD: "FX:EURUSD", GBPUSD: "FX:GBPUSD", USDJPY: "FX:USDJPY", USDCHF: "FX:USDCHF", AUDUSD: "FX:AUDUSD", USDCAD: "FX:USDCAD", NZDUSD: "FX:NZDUSD",
  USDZAR: "FX_IDC:USDZAR", USDEGP: "FX_IDC:USDEGP", USDNGN: "FX_IDC:USDNGN", USDKES: "FX_IDC:USDKES",
  // commodities (spot / CFD codes; CME futures are not offered in the free widget)
  GCUSD: "OANDA:XAUUSD", SIUSD: "OANDA:XAGUSD", PLUSD: "OANDA:XPTUSD", HGUSD: "OANDA:XCUUSD", CLUSD: "OANDA:WTICOUSD", BZUSD: "OANDA:BCOUSD", NGUSD: "OANDA:NATGASUSD",
  // yields
  DGS2: "TVC:US02Y", DGS10: "TVC:US10Y",
};
export const tvSymbol = (symbol: string, kind: string): string | null => (kind === "stock" ? symbol : MAP[symbol] ?? null);

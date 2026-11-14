/* ================= hubs (real places, real exchange hours in local time) ================= */
const HUBS = [
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
 {id:'syd', name:'Sydney', ex:'ASX', lat:-33.87, lon:151.21, tz:'Australia/Sydney', o:600, c:960, idx:'ASX 200', bond:'Australia 10-year', bsrc:'FMP', fx:'AUD/USD'}
];
const byId = Object.fromEntries(HUBS.map(h=>[h.id,h]));


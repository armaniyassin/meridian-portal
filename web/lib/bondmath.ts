/** Fixed-income measures for a constant-maturity Treasury, worked out as a par bond (coupon = yield, price 100, semi-annual coupons).
 *  Formulas follow the CFA fixed-income curriculum: Macaulay duration, modified duration, money duration, price value of a basis point and convexity.
 *  Everything here is calculated from the real yield; nothing is looked up or guessed. */
export function parBondMeasures(yieldPct: number, years: number) {
  const m = 2, n = Math.round(years * m), r = yieldPct / 100 / m, c = 100 * (yieldPct / 100) / m;
  let pv = 0, wt = 0, cx = 0;
  for (let i = 1; i <= n; i++) {
    const cf = c + (i === n ? 100 : 0), d = Math.pow(1 + r, i), p = cf / d;
    pv += p; wt += (i / m) * p; cx += (cf * i * (i + 1)) / Math.pow(1 + r, i + 2);
  }
  const macaulay = wt / pv, modified = macaulay / (1 + r), convexity = cx / pv / (m * m);
  return {
    ytm: yieldPct, cy: yieldPct, coupon: yieldPct, price: pv, macdur: macaulay, moddur: modified, effdur: modified,
    moneydur: modified * pv, pvbp: modified * pv * 0.0001, convexity,
  };
}
/** Maturity in years from labels like "US 10-year Treasury". */
export const maturityYears = (label: string) => { const m = /(\d+)-year/.exec(label); return m ? Number(m[1]) : null; };

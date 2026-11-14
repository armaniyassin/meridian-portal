export type Cell<T> = { i: T; x: number; y: number; w: number; h: number };

/** Squarified treemap (Bruls et al.), ported from the prototype. Items need a weight `w`. */
export function squarify<T extends { w: number }>(items: T[], x: number, y: number, w: number, h: number): Cell<T>[] {
  const out: Cell<T>[] = [], tot = items.reduce((s, i) => s + i.w, 0);
  if (!tot || w <= 0 || h <= 0) return out;
  let rest = items.slice().sort((p, q) => q.w - p.w).map((i) => ({ i, a: (i.w / tot) * w * h }));
  const worst = (row: { a: number }[], side: number) => {
    const s = row.reduce((t, r) => t + r.a, 0), mx = Math.max(...row.map((r) => r.a)), mn = Math.min(...row.map((r) => r.a));
    return Math.max((side * side * mx) / (s * s), (s * s) / (side * side * mn));
  };
  while (rest.length) {
    const side = Math.min(w, h);
    const row = [rest[0]];
    let k = 1;
    while (k < rest.length && worst(row.concat(rest[k]), side) <= worst(row, side)) { row.push(rest[k]); k++; }
    const s = row.reduce((t, r) => t + r.a, 0);
    if (w >= h) { const cw = s / h; let cy = y; row.forEach((r) => { const ch = r.a / cw; out.push({ i: r.i, x, y: cy, w: cw, h: ch }); cy += ch; }); x += cw; w -= cw; }
    else { const ch = s / w; let cx = x; row.forEach((r) => { const cw = r.a / ch; out.push({ i: r.i, x: cx, y, w: cw, h: ch }); cx += cw; }); y += ch; h -= ch; }
    rest = rest.slice(k);
  }
  return out;
}

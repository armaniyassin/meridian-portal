// Illustrations only. Every number in them is an invented teaching example, never market data.
export const VIS: Record<string, () => string> = {
 seesaw:()=>`<svg viewBox="0 0 320 200" class="vis" role="img" aria-label="Seesaw: when yield goes up, price goes down"><g class="seesaw"><rect x="40" y="132" width="240" height="6" rx="3" fill="var(--text)" opacity=".85"/>
  <g transform="translate(66,98)"><rect width="72" height="32" rx="8" fill="var(--accent)" fill-opacity=".16" stroke="var(--accent)"/><text x="36" y="20" text-anchor="middle" class="t">Yield</text></g>
  <g transform="translate(182,98)"><rect width="72" height="32" rx="8" fill="var(--down)" fill-opacity=".14" stroke="var(--down)"/><text x="36" y="20" text-anchor="middle" class="t">Price</text></g></g>
  <path d="M160 138 L141 172 H179 Z" fill="var(--muted)" opacity=".55"/><text x="160" y="192" text-anchor="middle">Fixed coupon, moving price</text></svg>`,
 double:()=>{ const v=[1,2,4,8], lab=['100','200','400','800'], ax=['Now','12 yrs','24 yrs','36 yrs'];
  return `<svg viewBox="0 0 320 200" class="vis" role="img" aria-label="Bars doubling every 12 years at 6 percent a year">`+v.map((n,i)=>{const h=n*13, x=46+i*66; return `<rect class="grow" style="animation-delay:${i*.18}s" x="${x}" y="${150-h}" width="42" height="${h}" rx="5" fill="var(--accent)" fill-opacity="${.35+i*.2}"/><text x="${x+21}" y="${144-h}" text-anchor="middle" class="t">${lab[i]}</text><text x="${x+21}" y="168" text-anchor="middle">${ax[i]}</text>`}).join('')+
  `<line x1="30" x2="300" y1="150" y2="150" stroke="var(--line)"/><text x="160" y="190" text-anchor="middle">100 grows at 6% a year. 72 ÷ 6 = 12</text></svg>`; },
 diversify:()=>{ const f=[.05,.07,.09,.06,.08], p=[0,1.7,3.1,4.4,5.6], A=[26,22,24,20,25]; const xs: number[]=[]; for(let x=20;x<=300;x+=4) xs.push(x);
  const ys=f.map((ff,k)=>xs.map(x=>100+A[k]*Math.sin(x*ff*1.4+p[k])));
  const avg=xs.map((x,i)=>ys.reduce((s,a)=>s+a[i],0)/ys.length);
  const path=a=>a.map((y,i)=>(i?'L':'M')+xs[i]+' '+y.toFixed(1)).join(' ');
  return `<svg viewBox="0 0 320 200" class="vis" role="img" aria-label="Five wavy lines and a smoother average line">`+ys.map(a=>`<path d="${path(a)}" fill="none" stroke="var(--muted)" stroke-width="1.2" opacity=".55"/>`).join('')+
  `<path class="draw" d="${path(avg)}" fill="none" stroke="var(--accent)" stroke-width="3" stroke-linecap="round" pathLength="1"/><text x="20" y="182">Five investments (thin) and an equal mix (thick)</text><text x="20" y="196" style="opacity:.7">Illustration, not market data</text></svg>`; },
 pe:()=>`<svg viewBox="0 0 320 200" class="vis" role="img" aria-label="Grid of 20 squares, one highlighted as one year of earnings">`+Array.from({length:20},(_,i)=>`<rect x="${34+(i%5)*26}" y="${38+Math.floor(i/5)*26}" width="21" height="21" rx="4" fill="var(--accent)" fill-opacity="${i===0?1:.14}" stroke="var(--accent)" stroke-opacity="${i===0?1:.4}"/>`).join('')+
  `<text x="34" y="30">1 square = 1 year of earnings</text><text x="188" y="62" class="t">P/E = price ÷ earnings</text><text x="188" y="84">100 ÷ 5 = 20</text><text x="188" y="104">Price equals 20 years</text><text x="188" y="120">of today's earnings</text><text x="34" y="176" style="opacity:.7">Example with made-up numbers</text></svg>`,
 curve:()=>{ const P=[{x:20,n:'Normal',d:'M0 52 Q26 28 70 18'},{x:122,n:'Flat',d:'M0 34 L70 32'},{x:224,n:'Inverted',d:'M0 18 Q34 26 70 54'}];
  return `<svg viewBox="0 0 320 200" class="vis" role="img" aria-label="Three yield curve shapes: normal, flat and inverted">`+P.map((c,i)=>`<g transform="translate(${c.x},56)"><path d="M0 0 V74 H78" fill="none" stroke="var(--line)" stroke-width="1.5"/><g transform="translate(4,8)"><path class="draw" style="animation-delay:${i*.25}s" d="${c.d}" fill="none" stroke="${i===2?'var(--down)':'var(--accent)'}" stroke-width="2.6" stroke-linecap="round" pathLength="1"/></g><text x="39" y="96" text-anchor="middle" class="t">${c.n}</text></g>`).join('')+
  `<text x="20" y="40">Yield</text><text x="236" y="152" text-anchor="end" style="opacity:0">.</text><text x="160" y="190" text-anchor="middle">Short maturity on the left, long on the right</text></svg>`; },
 fx:()=>`<svg viewBox="0 0 320 200" class="vis" role="img" aria-label="Euro as base currency priced in dollars">
  <circle cx="72" cy="92" r="36" fill="var(--accent)" fill-opacity=".14" stroke="var(--accent)"/><text x="72" y="96" text-anchor="middle" class="t" style="font-size:16px">EUR</text><text x="72" y="148" text-anchor="middle">base</text>
  <circle cx="248" cy="92" r="36" fill="var(--up)" fill-opacity=".12" stroke="var(--up)"/><text x="248" y="96" text-anchor="middle" class="t" style="font-size:16px">USD</text><text x="248" y="148" text-anchor="middle">quote</text>
  <path class="flow" d="M114 92 H206" stroke="var(--muted)" stroke-width="1.5" fill="none"/><path d="M206 92 l-8 -5 v10 z" fill="var(--muted)"/>
  <text x="160" y="80" text-anchor="middle" class="t">1.1000</text><text x="160" y="176" text-anchor="middle">1 EUR costs 1.1000 USD (example)</text></svg>`,
 riskreturn:()=>`<svg viewBox="0 0 320 200" class="vis" role="img" aria-label="Higher risk goes with higher expected return">
  <path d="M40 20 V160 H300" fill="none" stroke="var(--line)" stroke-width="1.5"/><text x="46" y="30">Expected return</text><text x="300" y="178" text-anchor="end">Risk (size of swings)</text>
  <path class="draw" d="M62 144 Q130 128 168 104 T272 48" fill="none" stroke="var(--accent)" stroke-width="2.6" stroke-linecap="round" pathLength="1"/>
  <circle cx="62" cy="144" r="5.5" fill="var(--accent)"/><text x="62" y="132" text-anchor="middle" class="t">Cash</text>
  <circle cx="168" cy="104" r="5.5" fill="var(--accent)"/><text x="168" y="92" text-anchor="middle" class="t">Bonds</text>
  <circle cx="272" cy="48" r="5.5" fill="var(--accent)"/><text x="272" y="36" text-anchor="middle" class="t">Stocks</text>
  <text x="160" y="196" text-anchor="middle" style="opacity:.75">Expected, never guaranteed</text></svg>`,
 spread:()=>`<svg viewBox="0 0 320 200" class="vis" role="img" aria-label="Bid and ask prices with the spread between them">
  <rect x="44" y="56" width="92" height="64" rx="8" fill="var(--up)" fill-opacity=".14" stroke="var(--up)"/><text x="90" y="82" text-anchor="middle" class="t">Bid</text><text x="90" y="102" text-anchor="middle">99.95</text><text x="90" y="140" text-anchor="middle">Buyers offer</text>
  <rect x="184" y="56" width="92" height="64" rx="8" fill="var(--down)" fill-opacity=".12" stroke="var(--down)"/><text x="230" y="82" text-anchor="middle" class="t">Ask</text><text x="230" y="102" text-anchor="middle">100.05</text><text x="230" y="140" text-anchor="middle">Sellers want</text>
  <path d="M136 38 H184" stroke="var(--muted)"/><path d="M136 34 v8 M184 34 v8" stroke="var(--muted)"/><text x="160" y="28" text-anchor="middle" class="t">Spread 0.10</text><text x="160" y="184" text-anchor="middle" style="opacity:.75">Example prices</text></svg>`,
 vix:()=>`<svg viewBox="0 0 320 200" class="vis" role="img" aria-label="A widening cone showing expected range, not direction">
  <g class="cone"><path d="M40 100 L286 34 L286 166 Z" fill="var(--accent)" fill-opacity=".14" stroke="var(--accent)" stroke-opacity=".6"/></g>
  <path d="M40 100 H286" stroke="var(--muted)" stroke-dasharray="4 5"/><circle cx="40" cy="100" r="5" fill="var(--accent)"/><text x="40" y="124" text-anchor="middle">Today</text>
  <text x="214" y="30" class="t">Wider = bigger expected swings</text><text x="160" y="190" text-anchor="middle">VIX: how wide, not which way</text></svg>`,
 dca:()=>{ const pr=[10,8,5,8,10,12], sh=pr.map(p=>100/p), m=['M1','M2','M3','M4','M5','M6'];
  return `<svg viewBox="0 0 320 200" class="vis" role="img" aria-label="When price is low a fixed sum buys more shares">`+pr.map((p,i)=>{const x=60+i*40; return `<rect x="${x}" y="${88-p*6}" width="26" height="${p*6}" rx="4" fill="var(--muted)" fill-opacity=".4"/><rect class="grow" style="animation-delay:${i*.1}s" x="${x}" y="${172-sh[i]*3}" width="26" height="${sh[i]*3}" rx="4" fill="var(--accent)" fill-opacity=".75"/><text x="${x+13}" y="186" text-anchor="middle" style="font-size:9px">${m[i]}</text>`}).join('')+
  `<text x="8" y="50">Price</text><text x="8" y="140">Shares</text><text x="8" y="152">for 100</text><line x1="50" x2="300" y1="88" y2="88" stroke="var(--line)"/><line x1="50" x2="300" y1="172" y2="172" stroke="var(--line)"/></svg>`; },
 inflation:()=>{ const v=[100,86,74], ax=['Today','5 years','10 years'];
  return `<svg viewBox="0 0 320 200" class="vis" role="img" aria-label="Buying power of 100 falls to about 74 over ten years at 3 percent inflation">`+v.map((n,i)=>{const h=n*1.1, x=64+i*80; return `<rect class="grow" style="animation-delay:${i*.2}s" x="${x}" y="${150-h}" width="52" height="${h}" rx="6" fill="var(--down)" fill-opacity="${1-i*.28}"/><text x="${x+26}" y="${144-h}" text-anchor="middle" class="t">${n}</text><text x="${x+26}" y="168" text-anchor="middle">${ax[i]}</text>`}).join('')+
  `<line x1="40" x2="290" y1="150" y2="150" stroke="var(--line)"/><text x="160" y="192" text-anchor="middle">Buying power of 100 at 3% inflation</text></svg>`; }
};

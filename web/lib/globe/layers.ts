// @ts-nocheck  (ported from the prototype's vanilla canvas code; behaviour is covered by the same tests there)
/* ================= Globe layers: satellites · submarine cables · air traffic =================
   Opt-in by design: the page requests nothing from these feeds until a toggle is switched on
   (clean load, no third-party calls before the visitor asks for them).
   Never invents data: if a feed fails, the layer keeps its last REAL snapshot and labels it with its UTC time,
   or says "Unavailable right now". Positions for satellites are computed from published orbital elements.
   The feeds are read from our own server (server.mjs now; Next.js route handlers + Supabase cache later):
   OpenSky and TeleGeography send no CORS headers, so browsers cannot call them directly. Data can also be pushed
   in with PortalData.setSatellites / setCables / setAircraft.
   Licence notes (Dept 06, resolve before launch): CelesTrak = free, honour the 2 h update cycle;
   TeleGeography cable map = CC BY-NC-SA (commercial use needs their data licence); OpenSky = non-commercial
   unless licensed (anonymous: 400 credits/day, a global call costs 4). */
const LAYER_SOURCES = {
  satellites:{ url:'/api/layers/satellites', ttl:2*3600e3, credit:'CelesTrak' },
  cables:    { url:'/api/layers/cables',                                                         ttl:7*864e5,  credit:'TeleGeography' },
  aircraft:  { url:'/api/layers/aircraft',                                                       ttl:120e3,    credit:'OpenSky Network' }
};
const CABLE_HI_KM = 6000;                       // "most important" = long-haul systems, measured on the map geometry
const LRAD = Math.PI/180;
/* plane colours (dark / light theme). Amber keeps planes apart from the blue cables, the white satellites and the up/down market colours */
const AIR_TONES = {amber:{d:'#e9b768',l:'#b07a1e'}, cyan:{d:'#6fd3e8',l:'#0b7a94'}, mint:{d:'#8fd8c0',l:'#2f7f66'}, violet:{d:'#b9a6ea',l:'#6a4fb0'}};
const hhmm = ms => new Date(ms).toISOString().slice(11,16)+' UTC';
const lsGet = k => { try{ return JSON.parse(localStorage.getItem('mgm-l-'+k)); }catch(e){ return null; } };
const lsSet = (k,v) => { try{ localStorage.setItem('mgm-l-'+k, JSON.stringify(v)); }catch(e){} };
async function layerFetch(url, ms=20000){
  const c=new AbortController(), t=setTimeout(()=>c.abort(), ms);
  try{
    const r=await fetch(url,{signal:c.signal, headers:{Accept:'application/json'}, credentials:'omit', referrerPolicy:'no-referrer'});
    if(!r.ok) throw new Error('HTTP '+r.status);
    const at=+r.headers.get('X-Fetched-At');                                           // when the server took this snapshot
    return {raw:await r.json(), t:at>0?at:Date.now(), stale:r.headers.get('X-Stale')==='1'};
  } finally { clearTimeout(t); }
}
const havKm = (la1,lo1,la2,lo2) => { const a=Math.sin((la2-la1)*LRAD/2)**2+Math.cos(la1*LRAD)*Math.cos(la2*LRAD)*Math.sin((lo2-lo1)*LRAD/2)**2; return 12742*Math.asin(Math.min(1,Math.sqrt(a))); };

/* ---- satellite position from mean elements: two-body Kepler + J2 secular drift (approximate, fine at globe scale) ---- */
const MU=398600.4418, RE=6378.137, J2=1.08263e-3;
function prepSat(o){
  const n=o.m*2*Math.PI/86400, a=Math.cbrt(MU/(n*n)), e=o.e, i=o.i*LRAD, p=a*(1-e*e), k=1.5*J2*(RE/p)**2*n;
  return {name:o.n, id:o.id, n, a, e, i, ci:Math.cos(i), si:Math.sin(i), r0:o.r*LRAD, w0:o.w*LRAD, M0:o.M*LRAD, t0:o.ep,
          dR:-k*Math.cos(i), dW:k*(2-2.5*Math.sin(i)**2), iss:/ISS \(ZARYA\)/.test(o.n||'')};
}
function satAt(s, t){
  const dt=(t-s.t0)/1000, M=s.M0+s.n*dt, R=s.r0+s.dR*dt, w=s.w0+s.dW*dt, e=s.e;
  let E=M; for(let k=0;k<5;k++) E-=(E-e*Math.sin(E)-M)/(1-e*Math.cos(E));
  const nu=2*Math.atan2(Math.sqrt(1+e)*Math.sin(E/2), Math.sqrt(1-e)*Math.cos(E/2)), r=s.a*(1-e*Math.cos(E)), u=w+nu;
  const cu=Math.cos(u), su=Math.sin(u), cR=Math.cos(R), sR=Math.sin(R);
  const x=r*(cR*cu-sR*su*s.ci), y=r*(sR*cu+cR*su*s.ci), z=r*su*s.si;
  const gmst=((280.46061837+360.98564736629*(t/864e5+2440587.5-2451545))%360)*LRAD;
  let lon=Math.atan2(y,x)-gmst; lon=((lon+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;
  return {lat:Math.asin(z/r), lon, alt:r-RE};
}

export class GlobeLayers{
  constructor(el, o={}){
    this.el=el; this.active=o.active||(()=>true);
    const mk=key=>({key,on:false,st:'off',ts:null,n:0,hi:0,fails:0,next:0,busy:false,applied:0});
    this.L={sat:mk('satellites'), cab:mk('cables'), air:mk('aircraft')};
    this.sats=[]; this.satPos=[]; this.satT=0; this.cables=[]; this.air=null; this.airT=0; this.hov=null; this.pickT=0; this.tone='amber'; this.calm=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.hints={sat:'Orbiting now', cab:'Long-haul systems highlighted', air:'Live positions'};
    this.build(); setInterval(()=>this.tick(), 15000);
  }
  /* ---- UI ---- */
  build(){
    const el=this.el, handle=el.querySelector('#lyrHandle');
    el.querySelectorAll('[data-layer]').forEach(b=>b.addEventListener('click',()=>this.toggle(b.dataset.layer)));
    handle.addEventListener('click',e=>{ e.stopPropagation(); const o=el.classList.toggle('open'); handle.setAttribute('aria-expanded',o); });
    document.addEventListener('click',e=>{ if(!el.contains(e.target)){ el.classList.remove('open'); handle.setAttribute('aria-expanded','false'); } });
    el.addEventListener('keydown',e=>{ if(e.key==='Escape'){ el.classList.remove('open'); handle.setAttribute('aria-expanded','false'); handle.focus(); } });
  }
  paint(id){
    const L=this.L[id], s=this.el.querySelector(`[data-status="${id}"]`), b=this.el.querySelector(`[data-layer="${id}"]`);
    b.setAttribute('aria-checked',L.on);
    const word={sat:'satellites',cab:'systems',air:'aircraft'}[id];
    let txt=this.hints[id];
    if(L.on){
      if(L.st==='loading') txt='Loading…';
      else if(L.st==='error') txt=location.protocol==='file:'?'Unavailable right now':'Unavailable right now';
      else if(L.st==='live'||L.st==='cached'){
        const tail = id==='cab' ? `${L.hi} highlighted` : (L.ts?hhmm(L.ts):'');
        txt = `${L.n.toLocaleString('en-US')} ${word}${tail?' · '+tail:''}${L.st==='cached'?' · cached, feed unavailable':''}${id==='sat'?' · approx.':''}`;
      }
    }
    s.textContent=txt;
    const on=Object.entries(this.L).filter(([k,v])=>v.on);
    const src=this.el.querySelector('#lyrSrc');
    src.hidden=!on.length;
    src.textContent=on.length?'Data: '+on.map(([k,v])=>LAYER_SOURCES[v.key].credit).join(' · '):'';
  }
  toggle(id){
    const L=this.L[id]; L.on=!L.on; this.hov=null;
    if(L.on){ L.next=0; L.st=L.applied?'live':'loading'; this.paint(id); this.load(id); }
    else { L.st='off'; this.paint(id); }
  }
  /* ---- data ---- */
  async load(id){
    const L=this.L[id], S=LAYER_SOURCES[L.key]; if(L.busy) return;
    const c=lsGet(L.key), now=Date.now();
    if(c && c.t===L.applied && now-c.t<S.ttl) return;                                  // already showing this snapshot
    if(c && now-c.t<S.ttl){ this.apply(id,c.d,c.t,'live'); return; }                   // fresh enough: no network call
    if(now<L.next){ if(c) this.apply(id,c.d,c.t,'cached'); else { L.st='error'; this.paint(id); } return; }
    L.busy=true; if(!L.applied){ L.st='loading'; this.paint(id); }
    try{
      const {raw,t,stale}=await layerFetch(S.url), d=this.parse(id,raw);
      lsSet(L.key,{t,d}); L.fails=0; this.apply(id,d,t,stale?'cached':'live');
    }catch(e){
      L.fails++; L.next=now+Math.min(15*60e3, 30e3*2**L.fails);                         // exponential back-off
      if(c) this.apply(id,c.d,c.t,'cached'); else if(!L.applied){ L.st='error'; this.paint(id); }
    }finally{ L.busy=false; }
  }
  tick(){ if(!this.active()) return; for(const id of ['air','sat']) if(this.L[id].on) this.load(id); }
  ingest(id, raw){ this.apply(id, this.parse(id,raw), Date.now(), 'live'); }
  parse(id, raw){
    if(id==='sat') return this.parseSats(raw);
    if(id==='cab') return this.parseCables(raw);
    return this.parseAir(raw);
  }
  parseSats(raw){
    if(!Array.isArray(raw)) throw new Error('shape');
    const out=[];
    for(const o of raw){
      const m=+o.MEAN_MOTION, e=+o.ECCENTRICITY, i=+o.INCLINATION, r=+o.RA_OF_ASC_NODE, w=+o.ARG_OF_PERICENTER, M=+o.MEAN_ANOMALY;
      const ep=Date.parse(/Z$|[+-]\d\d:?\d\d$/.test(o.EPOCH||'')?o.EPOCH:(o.EPOCH||'')+'Z');
      if([m,e,i,r,w,M,ep].every(Number.isFinite) && m>0 && e>=0 && e<.9) out.push({n:o.OBJECT_NAME,id:o.NORAD_CAT_ID,m,e,i,r,w,M,ep});
    }
    if(!out.length) throw new Error('empty');
    return out;
  }
  parseCables(raw){
    const fs=raw&&raw.features; if(!Array.isArray(fs)||!fs.length) throw new Error('shape');
    const out=[];
    for(const f of fs){
      const g=f.geometry; if(!g) continue;
      const parts=g.type==='MultiLineString'?g.coordinates:(g.type==='LineString'?[g.coordinates]:null); if(!parts) continue;
      let len=0; const lines=[];
      for(const pl of parts){
        const flat=[]; let kLa=null,kLo=null,pLa=null,pLo=null;
        for(let i=0;i<pl.length;i++){
          const lo=pl[i][0], la=pl[i][1]; if(!Number.isFinite(lo)||!Number.isFinite(la)) continue;
          if(pLa!==null) len+=havKm(pLa,pLo,la,lo); pLa=la; pLo=lo;
          if(kLa===null || Math.hypot(la-kLa,(lo-kLo)*Math.cos(la*LRAD))>.3 || i===pl.length-1){ flat.push(+la.toFixed(2),+lo.toFixed(2)); kLa=la; kLo=lo; }
        }
        if(flat.length>=4) lines.push(flat);
      }
      if(lines.length){ const pr=f.properties||{}; out.push({n:String(pr.name||pr.id||'Submarine cable'), l:Math.round(len), p:lines}); }
    }
    if(!out.length) throw new Error('empty');
    return out;
  }
  parseAir(raw){
    if(!raw||!Array.isArray(raw.states)) throw new Error('shape');
    const a=[];
    for(const s of raw.states){
      if(s[8]||s[5]==null||s[6]==null||s[9]==null||s[10]==null) continue;                // airborne, with position, speed and track
      a.push([+s[5].toFixed(3), +s[6].toFixed(3), +s[10].toFixed(1), +s[9].toFixed(0), (s[1]||'').trim(), s[2]||'']);
      if(a.length>=15000) break;
    }
    if(!a.length) throw new Error('empty');
    return {time:raw.time||Math.floor(Date.now()/1000), a};
  }
  apply(id, d, t, mode){
    const L=this.L[id];
    if(id==='sat'){
      this.sats=d.map(prepSat); this.satT=0; L.n=this.sats.length; L.ts=t;
    }else if(id==='cab'){
      const hiKm = d.some(c=>c.l>=CABLE_HI_KM) ? CABLE_HI_KM : [...d].map(c=>c.l).sort((a,b)=>b-a)[Math.max(0,Math.floor(d.length*.1)-1)];
      this.cables=d.map(c=>({name:c.n, hi:c.l>=hiKm, lines:c.p.map(f=>{ const m=f.length/2, A=new Float32Array(m*3); for(let i=0;i<m;i++){ const la=f[2*i]*LRAD; A[3*i]=Math.sin(la); A[3*i+1]=Math.cos(la); A[3*i+2]=f[2*i+1]*LRAD; } return A; })}));
      L.n=this.cables.length; L.hi=this.cables.filter(c=>c.hi).length; L.ts=t;
    }else{
      const n=d.a.length, A={time:d.time, n, lon:new Float64Array(n), lat:new Float64Array(n), trk:new Float32Array(n), vel:new Float32Array(n), cs:new Array(n), co:new Array(n), sl:new Float32Array(n), cl:new Float32Array(n), pl:new Float32Array(n), sa:new Float32Array(n), ca:new Float32Array(n), pa:new Float64Array(n)};
      d.a.forEach((s,i)=>{ A.lon[i]=s[0]*LRAD; A.lat[i]=s[1]*LRAD; A.trk[i]=s[2]*LRAD; A.vel[i]=s[3]; A.cs[i]=s[4]; A.co[i]=s[5]; });
      this.air=A; this.airT=0; L.n=n; L.ts=d.time*1000;
    }
    L.applied=t; L.st=mode; this.paint(id);
  }
  /* ---- drawing (called by Globe.frame) ---- */
  draw(g, t, R, P){
    if(!(this.L.cab.on||this.L.sat.on||this.L.air.on)) return;
    const dark=P.l[0]>150, x=g.x;
    if(g.mx!=null && !g.drag && !g.hover && t-this.pickT>120){ this.pickT=t; this.hov=this.pick(g,R); } else if(g.mx==null||g.hover) this.hov=null;
    if(this.L.cab.on && this.cables.length) this.drawCables(g,x,R,dark);
    if(this.L.sat.on && this.sats.length) this.drawSats(g,x,t,R,dark);
    if(this.L.air.on && this.air) this.drawAir(g,x,t,R,dark);
  }
  drawCables(g,x,R,dark){
    const cp=Math.cos(g.pitch), sp=Math.sin(g.pitch), yaw=g.yaw, cx=g.cx, cy=g.cy, hov=this.hov&&this.hov.t==='cab'?this.hov.item:null;
    /* smooth path: a quadratic curve through the midpoints of the projected vertices, so there are no visible corners */
    const trace=(c)=>{ for(const ln of c.lines){ let px=0, py=0, n=0;
      const end=()=>{ if(n>1) x.lineTo(px,py); n=0; };
      for(let i=0;i<ln.length;i+=3){ const sl=ln[i], cl=ln[i+1], dl=ln[i+2]-yaw, cd=Math.cos(dl);
        if(sp*sl+cp*cl*cd<=0){ end(); continue; }
        const sx=cx+R*cl*Math.sin(dl), sy=cy-R*(cp*sl-sp*cl*cd);
        if(n===0) x.moveTo(sx,sy);
        else if(n===1) x.lineTo((px+sx)/2,(py+sy)/2);
        else x.quadraticCurveTo(px,py,(px+sx)/2,(py+sy)/2);
        px=sx; py=sy; n++; }
      end(); } };
    x.lineCap='round'; x.lineJoin='round';
    x.beginPath(); for(const c of this.cables) if(!c.hi) trace(c);
    x.strokeStyle=dark?'rgba(128,169,222,.30)':'rgba(61,111,180,.30)'; x.lineWidth=.7; x.stroke();
    x.beginPath(); for(const c of this.cables) if(c.hi) trace(c);
    x.strokeStyle=dark?'rgba(128,169,222,.10)':'rgba(61,111,180,.09)'; x.lineWidth=6; x.stroke();      // wide, very soft halo under highlighted systems
    x.strokeStyle=dark?'rgba(128,169,222,.16)':'rgba(61,111,180,.14)'; x.lineWidth=3; x.stroke();
    x.strokeStyle=dark?'rgba(176,208,248,.88)':'rgba(37,84,156,.88)'; x.lineWidth=1.1; x.stroke();
    if(!this.calm){                                                                                      // slow light that travels along the highlighted systems
      x.setLineDash([2,34]); x.lineDashOffset=-(performance.now()/90)%36;
      x.strokeStyle=dark?'rgba(236,244,255,.95)':'rgba(255,255,255,.9)'; x.lineWidth=1.6; x.stroke(); x.setLineDash([]); }
    if(hov){ x.beginPath(); trace(hov); x.strokeStyle=dark?'#e8f1fc':'#14315c'; x.lineWidth=2; x.stroke(); }
  }
  drawSats(g,x,t,R,dark){
    if(t-this.satT>1000){ this.satT=t; this.satPos=this.sats.map(s=>satAt(s,Date.now())); }
    const cp=Math.cos(g.pitch), sp=Math.sin(g.pitch), hov=this.hov&&this.hov.t==='sat'?this.hov.item:null;
    x.fillStyle=dark?'rgba(226,234,246,.92)':'rgba(38,62,100,.9)'; x.beginPath();
    const rings=[];
    this.satPos.forEach((p,i)=>{
      const q=this.satScreen(g,p,R,cp,sp); if(!q) return;
      x.moveTo(q.sx+1.8,q.sy); x.arc(q.sx,q.sy,1.8,0,7);
      if(this.sats[i].iss||this.sats[i]===hov) rings.push(q);
    });
    x.fill();
    x.strokeStyle=dark?'rgba(128,169,222,.95)':'rgba(61,111,180,.95)'; x.lineWidth=1.3;
    for(const q of rings){ x.beginPath(); x.arc(q.sx,q.sy,5,0,7); x.stroke(); }
  }
  satScreen(g,p,R,cp,sp){
    const sl=Math.sin(p.lat), cl=Math.cos(p.lat), dl=p.lon-g.yaw, cd=Math.cos(dl), r=1.03+.10*Math.min(1,p.alt/36000);   // altitude exaggerated for legibility
    const ux=cl*Math.sin(dl)*r, uy=(cp*sl-sp*cl*cd)*r, uz=(sp*sl+cp*cl*cd)*r;
    if(uz<=0 && ux*ux+uy*uy<=1) return null;                                                                         // behind the Earth
    return {sx:g.cx+ux*R, sy:g.cy-uy*R};
  }
  drawAir(g,x,t,R,dark){
    const A=this.air;
    if(t-this.airT>1000){ this.airT=t;                                                                               // dead-reckon from the last real fix
      const dt=Math.max(0,Math.min(900,(Date.now()-A.time*1000)/1000)), mv=(la,lo,tr,d)=>{ const c=Math.cos(d), s=Math.sin(d), la2=Math.asin(Math.sin(la)*c+Math.cos(la)*s*Math.cos(tr)); return [la2, lo+Math.atan2(Math.sin(tr)*s*Math.cos(la), c-Math.sin(la)*Math.sin(la2))]; };
      for(let i=0;i<A.n;i++){ const p=mv(A.lat[i],A.lon[i],A.trk[i],A.vel[i]*dt/6371000), q=mv(p[0],p[1],A.trk[i],.012);   // q = a point just ahead, gives the heading
        A.sl[i]=Math.sin(p[0]); A.cl[i]=Math.cos(p[0]); A.pl[i]=p[1]; A.sa[i]=Math.sin(q[0]); A.ca[i]=Math.cos(q[0]); A.pa[i]=q[1]; } }
    const cp=Math.cos(g.pitch), sp=Math.sin(g.pitch), yaw=g.yaw, cx=g.cx, cy=g.cy, hi=this.hov&&this.hov.t==='air'?this.hov.item:-1;
    const tone=AIR_TONES[this.tone]||AIR_TONES.amber, sz=Math.max(2.6, Math.min(4.2, R/115));
    const glyph=(i,k)=>{ const sl=A.sl[i], cl=A.cl[i], dl=A.pl[i]-yaw, cd=Math.cos(dl), z=sp*sl+cp*cl*cd; if(z<=.02) return false;
      const X=cx+R*cl*Math.sin(dl), Y=cy-R*(cp*sl-sp*cl*cd), d2=A.pa[i]-yaw, c2=Math.cos(d2);
      const X2=cx+R*A.ca[i]*Math.sin(d2), Y2=cy-R*(cp*A.sa[i]-sp*A.ca[i]*c2);
      let hx=X2-X, hy=Y2-Y; const h=Math.hypot(hx,hy)||1; hx/=h; hy/=h;                                              // unit heading on screen
      const s=sz*k*(.55+.45*Math.min(1,z*2.2)), nx=-hy, ny=hx;                                                       // glyph shrinks toward the limb (foreshortening)
      x.moveTo(X+hx*s*1.15, Y+hy*s*1.15);                                                                            // nose
      x.lineTo(X-hx*s*.8+nx*s*.78, Y-hy*s*.8+ny*s*.78);                                                              // left wing tip
      x.lineTo(X-hx*s*.28, Y-hy*s*.28);                                                                              // tail notch
      x.lineTo(X-hx*s*.8-nx*s*.78, Y-hy*s*.8-ny*s*.78);                                                              // right wing tip
      x.closePath(); return true; };
    x.lineJoin='round';
    x.beginPath(); for(let i=0;i<A.n;i++) glyph(i,1);
    x.strokeStyle=dark?'rgba(14,23,36,.78)':'rgba(246,245,240,.9)'; x.lineWidth=1.8; x.stroke();                      // halo in the page colour: separates each plane from the dotted globe
    x.fillStyle=dark?tone.d:tone.l; x.fill();
    if(hi>=0){ x.beginPath(); if(glyph(hi,1.9)){ x.strokeStyle=dark?'#fff':'#14315c'; x.lineWidth=1.4; x.stroke(); x.fillStyle=dark?tone.d:tone.l; x.fill(); } }
  }
  /* ---- hover: nearest satellite, aircraft, then cable (only while the pointer is over the globe) ---- */
  pick(g,R){
    const mx=g.mx, my=g.my, cp=Math.cos(g.pitch), sp=Math.sin(g.pitch), yaw=g.yaw, cx=g.cx, cy=g.cy;
    if(this.L.sat.on){ let best=null, bd=10;
      this.satPos.forEach((p,i)=>{ const q=this.satScreen(g,p,R,cp,sp); if(!q) return; const d=Math.hypot(q.sx-mx,q.sy-my); if(d<bd){ bd=d; best=i; } });
      if(best!==null) return {t:'sat', item:this.sats[best], text:this.sats[best].name}; }
    if(this.L.air.on && this.air){ const A=this.air; let best=-1, bd=8;
      for(let i=0;i<A.n;i++){ const sl=A.sl[i], cl=A.cl[i], dl=A.pl[i]-yaw, cd=Math.cos(dl); if(sp*sl+cp*cl*cd<=.02) continue;
        const d=Math.hypot(cx+R*cl*Math.sin(dl)-mx, cy-R*(cp*sl-sp*cl*cd)-my); if(d<bd){ bd=d; best=i; } }
      if(best>=0) return {t:'air', item:best, text:(A.cs[best]||'Aircraft')+(A.co[best]?' · '+A.co[best]:'')}; }
    if(this.L.cab.on){ let best=null, bd=7;
      for(const c of this.cables) for(const ln of c.lines) for(let i=0;i<ln.length;i+=3){
        const sl=ln[i], cl=ln[i+1], dl=ln[i+2]-yaw, cd=Math.cos(dl); if(sp*sl+cp*cl*cd<=0) continue;
        const d=Math.hypot(cx+R*cl*Math.sin(dl)-mx, cy-R*(cp*sl-sp*cl*cd)-my); if(d<bd){ bd=d; best=c; } }
      if(best) return {t:'cab', item:best, text:best.name}; }
    return null;
  }
  label(g,x,P){
    if(!this.hov||g.mx==null) return;
    x.font='500 12px "Hanken Grotesk",sans-serif';
    const w=x.measureText(this.hov.text).width+14; let lx=g.mx+14; if(lx+w>g.w-6) lx=g.mx-14-w;
    const ly=Math.max(6,g.my-11);
    x.fillStyle=P.labBg; x.strokeStyle=P.labLine; x.lineWidth=1; x.beginPath(); x.roundRect(lx,ly,w,22,7); x.fill(); x.stroke();
    x.fillStyle=P.labFg; x.fillText(this.hov.text,lx+7,ly+15);
  }
}

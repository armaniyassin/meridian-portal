/* ================= theme ================= */
const root = document.documentElement;
const isDark = () => root.dataset.theme ? root.dataset.theme==='dark' : matchMedia('(prefers-color-scheme: dark)').matches;
window.__pal = () => isDark()
  ? {l:[226,234,246], n:[112,138,176], s:'150,176,214', limb1:'rgba(110,150,210,.14)', limb2:'rgba(150,185,235,.28)', labBg:'rgba(17,27,41,.92)', labLine:'#35506f', labFg:'#e8edf3', mut:'#9aabbf', up:'#62bf9c'}
  : {l:[38,62,100], n:[160,172,190], s:'80,100,130', limb1:'rgba(61,111,180,.06)', limb2:'rgba(61,111,180,.2)', labBg:'rgba(255,254,251,.96)', labLine:'#d6d2c6', labFg:'#1f2d3d', mut:'#667487', up:'#3f8f73'};
function paintTheme(){ $('#thDark').setAttribute('aria-pressed',isDark()); $('#thLight').setAttribute('aria-pressed',!isDark()); }
function setTheme(t){ root.dataset.theme=t; try{localStorage.setItem('mgm-theme',t);}catch(e){} paintTheme(); }
try{ const s=localStorage.getItem('mgm-theme'); if(s) root.dataset.theme=s; }catch(e){}
$('#thDark').onclick=()=>setTheme('dark'); $('#thLight').onclick=()=>setTheme('light'); paintTheme();

/* ================= data adapter: the page never invents values ================= */
const store = {};
window.PortalData = { set(id, patch){ store[id]=Object.assign(store[id]||{},patch); $('#feedState').textContent='connected'; refreshPage(); } };
const fmtPct = v => v==null?'—':Number(v).toFixed(2);
const fmtFx  = v => v==null?'—':Number(v).toFixed(4);
const fmtIdx = v => v==null?'—':Number(v).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const toast = (()=>{let t; return m=>{const el=$('#toast'); el.textContent=m; el.classList.add('on'); clearTimeout(t); t=setTimeout(()=>el.classList.remove('on'),3400);} })();
const ARROW='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

/* ================= state ================= */
let current='lon', page=null, mtab='sessions', range='day', tzMode='utc', quota=5, sortKey='ticker', secIdx=0, animChart=true, lastRun=null;
const layers={eq:true,bd:true,fx:true};
const rowsT=[['AAPL','Technology'],['MSFT','Technology'],['NVDA','Technology'],['AMZN','Consumer Discretionary'],['TSLA','Consumer Discretionary'],['JPM','Financials'],['XOM','Energy'],['JNJ','Health Care']].map(([t,s])=>({t,s,state:'idle'}));

/* ================= globes ================= */
const lonHome = Math.max(-170,Math.min(170,-new Date().getTimezoneOffset()/4));
const g1 = new Globe($('#globe'), {interactive:true, markers:true, auto:.0014, yaw:lonHome*RAD, pitch:.3, cx:.5, R:(w,h)=>Math.min(w*.3,h*.37,360), cyPx:(R,w,h)=>h*.52, fp:lat=>Math.max(-.9,Math.min(.9,lat*RAD*.8)), onPick:h=>select(h.id)});
const g2 = new Globe($('#globe2'), {interactive:true, markers:true, auto:.0012, yaw:lonHome*RAD, pitch:.3, cx:.36, R:(w,h)=>Math.min(h*.43,w*.3), fp:lat=>Math.max(-.9,Math.min(.9,lat*RAD*.8)), onPick:h=>select(h.id)});
addEventListener('resize',()=>{ g1.resize(); g2.resize(); moveInd(); });
function select(id,noFocus){ current=id; g1.active=g2.active=id; const h=byId[id]; if(!noFocus){ g1.focus(h.lon,h.lat); g2.focus(h.lon,h.lat);} drawHubInfo(); if(page==='markets') drawMarkets(false); }
function cycle(d){ const i=HUBS.findIndex(h=>h.id===current); select(HUBS[(i+d+HUBS.length)%HUBS.length].id); }
$('#prevHub').onclick=()=>cycle(-1); $('#nextHub').onclick=()=>cycle(1);
function drawHubInfo(){ const h=byId[current], nc=nextChange(h,Date.now());
  $('#hubInfo').innerHTML=`<b style="font-weight:600">${h.name}</b><span style="color:var(--muted)">${h.ex}</span><span class="tag ${nc.open?'open':'closed'}">${nc.open?'Open':'Closed'}${nc.mins!=null?' · '+(nc.open?'closes':'opens')+' in '+human(nc.mins):''}</span>`; }

/* ================= router ================= */
const PAGES=['home','markets','sentiment','academy','brief','news','article'];
let artId=null;
const TITLES={home:'Meridian Global Macro',markets:'Markets | Meridian',sentiment:'Sentiment | Meridian',academy:'Academy | Meridian',brief:'Weekly brief | Meridian',news:'News and insights | Meridian'};
function route(){
  const h=(location.hash||'').replace('#','');
  if(h.startsWith('article-')){ const id=h.slice(8); if(artById(id)){ artId=id; show('article'); return; } }
  const p=(PAGES.includes(h)&&h!=='article')?h:'home';
  show(p);
}
function show(p){
  if(p===page && p!=='article') return;
  const prev=page?$('#p-'+page):null, next=$('#p-'+p);
  paintNav(p); $('#more').classList.remove('open'); $('#moreB').setAttribute('aria-expanded','false');
  const enter=()=>{
    $$('.page').forEach(x=>{x.hidden=true; x.classList.remove('out','enter');});
    next.hidden=false; if(!REDUCE) next.classList.add('enter'); page=p; scrollTo(0,0);
    onShow(p);
    if(!REDUCE){ requestAnimationFrame(()=>requestAnimationFrame(()=>next.classList.remove('enter'))); setTimeout(()=>next.classList.remove('enter'),900); }
  };
  if(prev && !REDUCE){ prev.classList.add('out'); setTimeout(enter,220); } else enter();
}
function paintNav(p){
  if(p==='article') p='news';
  $$('#nav a[data-p]').forEach(a=>{ if(a.dataset.p===p) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current'); });
  moveInd(p);
}
function moveInd(){}
function onShow(p){
  document.title = p==='article' ? ((artById(artId)||{}).t||'Article')+' | Meridian' : (TITLES[p]||TITLES.home);
  if(p==='home'){ g1.resize(); drawHubInfo(); initTrust(); initTips(); drawHeat(); }
  if(p==='news'){ drawNews(); }
  if(p==='article'){ drawArticle(); }
  if(p==='markets'){ g2.resize(); drawMarkets(true); }
  if(p==='sentiment'){ drawSent(); }
  if(p==='academy'){ drawAcademy(); }
  setupReveals(); applyFocus();
}
function refreshPage(){ if(typeof drawHeat==='function') drawHeat(); if(page==='markets') drawMarkets(false); if(page==='sentiment') drawSent(); }
addEventListener('hashchange',route);

/* More menu */
$('#moreB').onclick=e=>{ e.stopPropagation(); const m=$('#more'); const o=m.classList.toggle('open'); $('#moreB').setAttribute('aria-expanded',o); };
document.addEventListener('click',e=>{ if(!e.target.closest('#more')){ $('#more').classList.remove('open'); $('#moreB').setAttribute('aria-expanded','false'); } });
$('#mmDisc').addEventListener('click',e=>{ e.preventDefault(); $('#more').classList.remove('open'); const go=()=>$('#disc').scrollIntoView({behavior:REDUCE?'auto':'smooth',block:'center'}); if(page!=='home'){ location.hash='home'; setTimeout(go,700);} else go(); });

/* ================= scroll effects ================= */
function setupReveals(){
  const pg=$('#p-'+page); if(!pg) return;
  $$('.rv',pg).forEach(el=>{ if(el._rv) return; el._rv=1;
    const r=el.getBoundingClientRect(); if(r.top>innerHeight*.92 && !REDUCE) el.classList.add('pre'); else el.classList.add('in');
    if(el.classList.contains('pre')) io.observe(el); });
}
const io=new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target);} }),{threshold:.12});
function applyFocus(){
  if(REDUCE) return;
  const pg=$('#p-'+page); if(!pg) return; const vh=innerHeight;
  $$('.fx',pg).forEach(el=>{
    const r=el.getBoundingClientRect(); const c=r.top+r.height/2; const d=Math.abs(c-vh*.5)/(vh*.5);
    const a=Math.max(.18,Math.min(1,1-(d-.6)*1.3)), bl=Math.max(0,Math.min(7,(d-.65)*9));
    el.style.opacity=a.toFixed(3); el.style.filter=bl>.2?`blur(${bl.toFixed(1)}px)`:'none';
  });
}
addEventListener('scroll',applyFocus,{passive:true});
const hdr=$('#hdr'); let lastY=scrollY;
const hs=()=>{ const y=scrollY, dy=y-lastY; hdr.classList.toggle('scrolled',y>24);
  if(y<80) hdr.classList.remove('hide');
  else if(dy>6 && !$('#more').classList.contains('open')) hdr.classList.add('hide');
  else if(dy<-6) hdr.classList.remove('hide');
  if(Math.abs(dy)>6||y<80) lastY=y; };
addEventListener('scroll',hs,{passive:true}); hs();

/* ================= home: trust cards ================= */
const ICONS={
 shield:'<path d="M12 3l8 3v6c0 5-3.4 8-8 9-4.6-1-8-4-8-9V6l8-3z"/><path d="M8.5 12l2.5 2.5L15.5 10"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 scale:'<path d="M12 4v16M6 20h12M5 7h14"/><path d="M5 7l-3 7a3 3 0 0 0 6 0L5 7zM19 7l-3 7a3 3 0 0 0 6 0l-3-7z"/>',
 lock:'<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
 key:'<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16 7l3 3"/>'
};
const TRUST=[
 {t:'Real data only',ic:'shield',d:'Every price, yield and ratio comes from FRED, FMP or Finnhub. If a feed fails, we show the last saved value with its date, never an estimate.',tags:['FRED','FMP','Finnhub']},
 {t:'Timestamped and cached',ic:'clock',d:'Each number carries its last updated time in UTC. Every request is cached so the data providers stay within their limits.',tags:['UTC timestamps','Cached']},
 {t:'Educational, never advice',ic:'scale',d:'Sentiment reports and lessons are for learning and information. Nothing here is a recommendation to buy or sell.',tags:['Not advice','Compliance first']},
 {t:'Privacy first',ic:'lock',d:'We ask for an email and a learning level only with your explicit consent, and every message has a one click unsubscribe.',tags:['GDPR','One click unsubscribe']},
 {t:'Keys stay on the server',ic:'key',d:'Data keys and secrets never reach your browser. Every external call runs on our servers.',tags:['Server side only','Row level security']}
];
let tIdx=0, tInit=false;
function initTrust(){
  const box=$('#tcards');
  if(!tInit){ tInit=true;
    box.innerHTML=TRUST.map((c,i)=>`<button class="tc" type="button" role="listitem" data-i="${i}" aria-expanded="false"><svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${ICONS[c.ic]}</svg>
      <div><div class="tt">${c.t}</div><div class="more-b"><hr><p>${c.d}</p><div class="tags" style="margin-top:12px">${c.tags.map(x=>`<span>${x}</span>`).join('')}</div></div></div><span class="bar"></span></button>`).join('');
    box.addEventListener('pointerenter',e=>box.classList.add('paused')); box.addEventListener('pointerleave',()=>box.classList.remove('paused'));
    box.addEventListener('pointerover',e=>{ const c=e.target.closest('.tc'); if(c&&+c.dataset.i!==tIdx) setT(+c.dataset.i); });
    box.addEventListener('click',e=>{ const c=e.target.closest('.tc'); if(c) setT(+c.dataset.i); });
    box.addEventListener('animationend',e=>{ if(e.animationName==='fill') setT((tIdx+1)%TRUST.length); });
    $('#tPrev').onclick=()=>setT((tIdx+TRUST.length-1)%TRUST.length); $('#tNext').onclick=()=>setT((tIdx+1)%TRUST.length);
  }
  setT(tIdx);
}
function setT(i){ tIdx=i; $$('#tcards .tc').forEach((c,k)=>{ const on=k===i; c.classList.remove('on'); void c.offsetWidth; if(on) c.classList.add('on'); c.setAttribute('aria-expanded',on); }); }

/* dotted wave terrain behind the final call to action */
const wv=$('#wave'), wx=wv.getContext('2d'); let wmx=-1e3, wmy=-1e3;
function waveFrame(t){
  const r=wv.getBoundingClientRect(), d=Math.min(devicePixelRatio||1,2);
  if(wv.width!==Math.round(r.width*d)){ wv.width=Math.round(r.width*d); wv.height=Math.round(r.height*d); }
  wx.setTransform(d,0,0,d,0,0); wx.clearRect(0,0,r.width,r.height);
  const cols=Math.max(40,Math.floor(r.width/16)), rows=18, dk=isDark(), s=t/1000*(REDUCE?0:1);
  for(let j=0;j<rows;j++){
    const f=j/(rows-1), y0=r.height*(.28+.7*f*f), sc=.55+f*1.1;
    for(let i=0;i<cols;i++){
      const x=(i+.5)/cols*r.width;
      let y=y0+Math.sin(i*.22+s*.8+j*.55)*14*f+Math.sin(i*.07-s*.5)*10*f;
      const dx=x-wmx, dy=y-wmy, dd=Math.hypot(dx,dy); if(dd<110) y-=(1-dd/110)*18;
      const a=(.12+.7*f)*(dd<110?1.3:1);
      wx.fillStyle=dk?`rgba(180,208,255,${Math.min(1,a)})`:`rgba(27,79,216,${Math.min(1,a)})`;
      wx.fillRect(x,y,1.6*sc,1.6*sc);
    }
  }
}
$('#ctaSec').addEventListener('pointermove',e=>{ const r=wv.getBoundingClientRect(); wmx=e.clientX-r.left; wmy=e.clientY-r.top; });
$('#ctaSec').addEventListener('pointerleave',()=>{wmx=wmy=-1e3;});

/* ================= markets page ================= */
function seriesData(){
  const now=Date.now(), {t:base,shifted}=refDay(); const out={vals:[],desc:[],ax:[],nowIdx:-1,sub:''};
  if(range==='day'){
    const off=tzMode==='local'?-new Date().getTimezoneOffset()*60000:0;
    for(let h=0;h<24;h++){ const n=openCount(base+h*3600000+1800000-off); out.vals.push(n); out.desc.push(`<b>${pad(h)}:00 ${tzMode==='utc'?'UTC':'local'}</b> · ${n} of ${HUBS.length} exchanges open`); }
    if(!shifted) out.nowIdx=new Date(now+off).getUTCHours();
    out.ax=['00:00','06:00','12:00','18:00','23:00']; out.sub=(shifted?'Next trading day, ':'Today, ')+dfmt.format(new Date(base))+' · '+(tzMode==='utc'?'UTC':'your local time');
  }else{
    const n0=new Date(), st=Date.UTC(n0.getUTCFullYear(),n0.getUTCMonth(),n0.getUTCDate());
    for(let i=0;i<7;i++){ let tot=0; for(let m=0;m<1440;m+=30) tot+=openCount(st+i*86400000+m*60000)*.5; tot=Math.round(tot); out.vals.push(tot);
      out.desc.push(`<b>${dfmt.format(new Date(st+i*86400000))}</b> · ${tot} exchange-hours of trading`); out.ax.push(dfmt.format(new Date(st+i*86400000)).split(' ')[0]); }
    out.nowIdx=0; out.sub='Next 7 days, summed over eleven exchanges (UTC days)';
  }
  return out;
}
const refDay=()=>{ const n=new Date(); const d=Date.UTC(n.getUTCFullYear(),n.getUTCMonth(),n.getUTCDate()), wd=new Date(d).getUTCDay(); const sh=wd===6?2:wd===0?1:0; return {t:d+sh*86400000,shifted:sh}; };
const dfmt=new Intl.DateTimeFormat('en-GB',{weekday:'short',day:'numeric',month:'short',timeZone:'UTC'});
function areaSVG(s){
  const W=640,H=210,px=6,top=14,bot=8,n=s.vals.length,max=Math.max(1,...s.vals);
  const X=i=>px+i*(W-2*px)/(n-1), Y=v=>H-bot-(v/max)*(H-top-bot);
  const pts=s.vals.map((v,i)=>[X(i),Y(v)]), line=pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');
  const grid=[0,1,2,3].map(i=>{const y=top+i*(H-top-bot)/3; return `<line x1="0" x2="${W}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}" stroke="var(--line)" stroke-dasharray="3 5"/>`}).join('');
  const nd=s.nowIdx>=0?`<circle cx="${pts[s.nowIdx][0]}" cy="${pts[s.nowIdx][1]}" r="4.5" fill="var(--accent)" stroke="var(--surface)" stroke-width="2"/>`:'';
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Exchanges open"><defs><linearGradient id="ag" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="var(--accent)" stop-opacity=".38"/><stop offset="1" stop-color="var(--accent)" stop-opacity="0"/></linearGradient></defs>
  ${grid}<path class="ar" d="${line} L${X(n-1)} ${H-bot} L${X(0)} ${H-bot} Z" fill="url(#ag)"/><path class="ln" d="${line}" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round" pathLength="1400"/>${nd}
  <text x="2" y="${top-3}" font-size="10" fill="var(--muted)" font-family="Geist Mono,monospace">${max}</text></svg>`;
}
function hubCard(){
  const h=byId[current], t=Date.now(), nc=nextChange(h,t), d=store[h.id]||{};
  return `<div class="hcH"><div><div style="font-size:11px;color:var(--muted)">${h.ex} · local <span class="mono">${localClock(h.tz,t)}</span></div><h3>${h.name}</h3></div>
    <span class="tag ${nc.open?'open':'closed'}">${nc.open?'Open':'Closed'}${nc.mins!=null?' · '+human(nc.mins):''}</span></div>
    <div class="chips"><button class="chip" data-l="eq" aria-pressed="${layers.eq}"><span class="kbd">E</span>Equities</button><button class="chip" data-l="bd" aria-pressed="${layers.bd}"><span class="kbd">B</span>Bonds</button><button class="chip" data-l="fx" aria-pressed="${layers.fx}"><span class="kbd">F</span>FX</button></div>
    <div class="rows">
      <div class="row ${layers.eq?'':'off'}"><span class="k">Equity index</span><span class="n">${h.idx}</span><span class="v">${fmtIdx(d.idx)}</span><span class="src">FMP</span></div>
      <div class="row ${layers.bd?'':'off'}"><span class="k">10-year yield</span><span class="n">${h.bond}</span><span class="v">${h.bsrc?fmtPct(d.bond)+(d.bond!=null?'%':''):'n/a'}</span><span class="src">${h.bsrc||'no source yet'}</span></div>
      <div class="row ${layers.fx?'':'off'}"><span class="k">FX pair</span><span class="n">${h.fx}</span><span class="v">${fmtFx(d.fx)}</span><span class="src">FMP</span></div>
    </div><p class="note"><b style="font-weight:500;color:var(--text)">Last updated:</b> <span class="mono">${d.ts||'awaiting feed'}</span></p>`;
}
function tabSessions(){
  const t=Date.now(), s=seriesData(), openN=openCount(t);
  return `<div class="grid2"><div class="card"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:flex-start">
      <div><h3>Exchanges open now</h3><div class="bigtxt">${openN}<small> of ${HUBS.length} · ${s.sub}</small></div></div>
      <div style="display:flex;gap:6px;flex-wrap:wrap"><div class="seg"><button data-range="day" aria-pressed="${range==='day'}">Day</button><button data-range="week" aria-pressed="${range==='week'}">Week</button></div>
      ${range==='day'?`<div class="seg"><button data-tz="utc" aria-pressed="${tzMode==='utc'}">UTC</button><button data-tz="local" aria-pressed="${tzMode==='local'}">Local</button></div>`:''}</div></div>
      <div class="chartbox ${animChart?'anim':''}" id="cb">${areaSVG(s)}<div class="cursor" id="cur"></div><div class="hov" id="hov"></div></div>
      <div class="axis">${s.ax.map(a=>`<span>${a}</span>`).join('')}</div>
      <div class="readout" id="ro">${s.nowIdx>=0?s.desc[s.nowIdx]+' (now)':'Move over the chart for details.'}</div></div>
    <div class="card"><h3>How to read this</h3><p class="note" style="font-size:13.5px;margin-top:8px">The line counts how many of the eleven exchanges are in their regular session at each hour. Sessions overlap when Europe closes and New York opens, and when Asia hands over to Europe.</p>
    <p class="note" style="font-size:13.5px">Weekends show zero. Holidays are not included.</p></div></div>
    <div class="hubs">${HUBS.map(x=>{const o=isOpen(x,t); return `<button class="hubc ${o?'open':''}" data-id="${x.id}" aria-pressed="${x.id===current}"><span class="a"><i></i>${x.name}</span><span class="s">${x.ex} · ${o?'open':'closed'}</span><span class="tm">${localClock(x.tz,t)}</span></button>`}).join('')}</div>`;
}
function tabBonds(){
  const rows=[['US 2-year Treasury','FRED DGS2'],['US 10-year Treasury','FRED DGS10'],['VIX volatility index','FRED VIXCLS'],...HUBS.filter(h=>h.id!=='nyc').map(h=>[h.bond,h.bsrc||'no source yet'])];
  return `<div class="tablewrap"><table><thead><tr><th>Instrument</th><th>Source</th><th>Yield</th><th>Last updated</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${r[0]}</td><td class="mono" style="color:var(--muted)">${r[1]}</td><td class="mono">—</td><td class="mono" style="color:var(--muted)">awaiting feed</td></tr>`).join('')}</tbody></table></div>
    <p class="note">Yields show two decimals once the feed is connected. FRED data arrives with about one day of delay.</p>`;
}
function tabFx(){
  const pairs=[...new Set(HUBS.map(h=>h.fx))];
  return `<div class="tablewrap"><table><thead><tr><th>Pair</th><th>Source</th><th>Rate</th><th>Last updated</th></tr></thead><tbody>${pairs.map(p=>`<tr><td>${p}</td><td class="mono" style="color:var(--muted)">FMP</td><td class="mono">—</td><td class="mono" style="color:var(--muted)">awaiting feed</td></tr>`).join('')}</tbody></table></div>
    <p class="note">Rates show four decimals once the feed is connected.</p>`;
}
function tabIdx(){
  return `<div class="heat">${HUBS.map(h=>`<div class="tile" tabindex="0"><span>${h.idx}<br><small style="color:var(--muted)">${h.name}</small></span><span class="mono">—</span></div>`).join('')}</div>
    <p class="note">Tiles colour by daily move, emerald up and rose down, once the index feed is connected.</p>`;
}
function drawMarkets(anim){
  animChart=!!anim;
  $('#hubCard').innerHTML=hubCard();
  const b=$('#mBody'), keep=scrollY;
  b.innerHTML = mtab==='sessions'?tabSessions(): mtab==='bonds'?tabBonds(): mtab==='fx'?tabFx(): mtab==='heat'?tabHeat(): tabIdx();
  if(mtab==='sessions') bindChart();
  $$('#mtabs button').forEach(x=>x.setAttribute('aria-pressed',x.dataset.t===mtab));
}
function bindChart(){
  const hov=$('#hov'); if(!hov) return; const s=seriesData(), cur=$('#cur'), ro=$('#ro'), box=$('#cb');
  hov.addEventListener('pointermove',e=>{ const r=box.getBoundingClientRect(), f=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)), i=Math.round(f*(s.vals.length-1));
    cur.style.opacity=1; cur.style.left=(6+i*(640-12)/(s.vals.length-1))/640*100+'%'; ro.innerHTML=s.desc[i]; });
  hov.addEventListener('pointerleave',()=>{cur.style.opacity=0; ro.innerHTML=s.nowIdx>=0?s.desc[s.nowIdx]+' (now)':'Move over the chart for details.';});
}
$('#p-markets').addEventListener('click',e=>{
  const t=e.target, tab=t.closest('#mtabs button'), r=t.closest('[data-range]'), z=t.closest('[data-tz]'), hc=t.closest('.hubc'), ch=t.closest('.chip[data-l]');
  if(tab){ mtab=tab.dataset.t; drawMarkets(true); } else if(r){ range=r.dataset.range; drawMarkets(true); } else if(z){ tzMode=z.dataset.tz; drawMarkets(true); }
  else if(hc){ select(hc.dataset.id); scrollTo({top:0,behavior:REDUCE?'auto':'smooth'}); } else if(ch){ layers[ch.dataset.l]=!layers[ch.dataset.l]; drawMarkets(false); }
});

/* ================= sentiment page ================= */
const SECTORS=()=>['All sectors',...[...new Set(rowsT.map(r=>r.s).filter(s=>s!=='—'))].sort()];
function drawPips(){ const html=Array.from({length:5},(_,i)=>`<i class="${i<quota?'':'u'}"></i>`).join('')+` <span style="margin-left:4px">${quota} / 5</span>`; const e=$('#pipsQ'); if(e) e.innerHTML=html; }
function drawSent(){
  drawPips();
  const sec=SECTORS()[secIdx]||'All sectors';
  $('#secC').textContent=sec; $('#sortC').textContent='Sorted by '+(sortKey==='ticker'?'ticker':'sector');
  let list=rowsT.filter(r=>secIdx===0||r.s===sec); list=[...list].sort((a,b)=>sortKey==='ticker'?a.t.localeCompare(b.t):a.s.localeCompare(b.s)||a.t.localeCompare(b.t));
  $('#wl').innerHTML=list.map(r=>`<tr data-t="${r.t}" class="${r.hl?'hl':''}"><td><span class="logo">${r.t[0]}</span>${r.t}</td><td><span class="sect">${r.s}</span></td><td class="mono" style="color:var(--muted)">P/E — · EBITDA —</td>
   <td>${r.state==='idle'?`<button class="run" data-run="${r.t}">Run report</button>`:`<span class="tag closed">Awaiting engine</span>`}</td></tr>`).join('');
  const L=lastRun;
  $('#report').innerHTML=`<div class="top"><div><div style="font-size:11px;color:var(--muted)">${L?'Report':'Report preview'}</div><div style="font-family:var(--serif);font-size:26px;font-weight:700">${L||'Ticker'}</div></div><span class="tag ${L?'closed':'ai'}">${L?'Awaiting engine':'AI'}</span></div>
   <div class="score">—<small> / 100</small></div>
   <div class="rep-sec"><b>Label</b><span>Bullish, Neutral or Bearish once scored</span></div>
   <div class="rep-sec"><b>Catalysts</b><span>From the latest headlines</span></div>
   <div class="rep-sec"><b>Risks</b><span>From the latest headlines</span></div>
   <div class="rep-sec"><b>Fundamentals summary</b><span>Uses only the numbers passed in: P/E, EBITDA, market cap, debt to equity, ROE</span></div>`;
}
function runReport(t){
  const r=rowsT.find(x=>x.t===t); if(!r||r.state!=='idle') return;
  if(quota<=0){ $('#scrim').classList.add('on'); return; }
  quota--; r.state='queued'; lastRun=t; drawSent(); toast(`Preview: ${t} is queued. No score appears until the engine and data feeds are connected.`);
}
function ask(){
  const v=$('#ticker').value.trim().toUpperCase();
  if(!/^[A-Z][A-Z.\-]{0,5}$/.test(v)){ toast('Enter a ticker of 1 to 6 letters, for example AAPL.'); return; }
  let r=rowsT.find(x=>x.t===v); if(!r){ r={t:v,s:'—',state:'idle'}; rowsT.unshift(r); }
  rowsT.forEach(x=>x.hl=false); r.hl=true; secIdx=0; $('#ticker').value=''; drawSent(); runReport(v);
}
$('#askGo').onclick=ask; $('#ticker').addEventListener('keydown',e=>{ if(e.key==='Enter') ask(); });
$('#p-sentiment').addEventListener('click',e=>{
  const run=e.target.closest('[data-run]'); if(run){ runReport(run.dataset.run); return; }
  if(e.target.closest('#sortC')){ sortKey=sortKey==='ticker'?'sector':'ticker'; drawSent(); }
  if(e.target.closest('#secC')){ secIdx=(secIdx+1)%SECTORS().length; drawSent(); }
});

/* ================= academy page ================= */
const LVL=[
 {n:'Level 1 · Foundations',free:true,l:['Time value of money','Returns and risk','Bond pricing basics','Reading a yield curve']},
 {n:'Level 2 · Valuation',free:false,l:['Equity valuation models','Discounted cash flow','Ratio analysis']},
 {n:'Level 3 · Portfolio management',free:false,l:['Asset allocation','Risk budgeting','Portfolio construction']}];
const QZ=[
 {q:'You invest 100 today at 5% a year, compounded annually. What is it worth after 2 years?',o:['105.00','110.25','110.00'],a:1,e:'Each year multiplies by 1.05, so 100 × 1.05 × 1.05 = 110.25. The extra 0.25 is interest earned on the first year\'s interest.'},
 {q:'A bond pays a fixed coupon. If market yields rise, what generally happens to its price?',o:['It rises','It falls','It stays the same'],a:1,e:'New bonds pay more, so the older fixed coupon is less attractive and its price falls until its yield matches the market.'}];
let lvl=0, qi=0, qans=null;
function drawAcademy(){
  $('#lvBtns').innerHTML=LVL.map((l,i)=>`<button class="lvbtn" data-lv="${i}" aria-pressed="${i===lvl}"><div><b>${l.n}</b><span class="s">${l.l.length} lessons</span></div><span class="tag ${l.free?'open':'closed'}">${l.free?'Free':'Pro'}</span></button>`).join('');
  const L=LVL[lvl];
  $('#lessons').innerHTML=L.l.map((x,i)=>`<div class="lesson ${L.free?'':'lock'}"><div class="l"><span class="i mono">${pad(i+1)}</span><span>${x}</span></div><span class="tag closed">${L.free?'Reading + quiz':'Pro · locked'}</span></div>`).join('');
  drawQuiz();
}
function drawQuiz(){
  const Q=QZ[qi];
  $('#quiz').innerHTML=`<div class="eyebrow">Level 1 · practice question ${qi+1} of ${QZ.length}</div><h3>${Q.q}</h3>
    ${Q.o.map((o,i)=>`<button class="opt ${qans==null?'':(i===Q.a?'ok':(i===qans?'no':''))}" data-o="${i}" ${qans==null?'':'disabled'}>${String.fromCharCode(65+i)}. ${o}</button>`).join('')}
    ${qans==null?'':`<p class="expl"><b style="color:var(--text);font-weight:500">${qans===Q.a?'Correct.':'Not quite.'}</b> ${Q.e}</p><div style="margin-top:12px"><button class="b" id="nextQ">${qi<QZ.length-1?'Next question':'Start again'}</button></div>`}`;
}
$('#p-academy').addEventListener('click',e=>{
  const lb=e.target.closest('[data-lv]'); if(lb){ lvl=+lb.dataset.lv; drawAcademy(); if(!LVL[lvl].free) toast('Levels 2 and 3 need a Pro plan.'); return; }
  const o=e.target.closest('[data-o]'); if(o&&qans==null){ qans=+o.dataset.o; drawQuiz(); return; }
  if(e.target.closest('#nextQ')){ qi=(qi+1)%QZ.length; qans=null; drawQuiz(); }
});

const TIP_DELAY=60000;
/* ================= visuals (illustrations, never market data) ================= */
const VIS={
 seesaw:()=>`<svg viewBox="0 0 320 200" class="vis" role="img" aria-label="Seesaw: when yield goes up, price goes down"><g class="seesaw"><rect x="40" y="132" width="240" height="6" rx="3" fill="var(--text)" opacity=".85"/>
  <g transform="translate(66,98)"><rect width="72" height="32" rx="8" fill="var(--accent)" fill-opacity=".16" stroke="var(--accent)"/><text x="36" y="20" text-anchor="middle" class="t">Yield</text></g>
  <g transform="translate(182,98)"><rect width="72" height="32" rx="8" fill="var(--down)" fill-opacity=".14" stroke="var(--down)"/><text x="36" y="20" text-anchor="middle" class="t">Price</text></g></g>
  <path d="M160 138 L141 172 H179 Z" fill="var(--muted)" opacity=".55"/><text x="160" y="192" text-anchor="middle">Fixed coupon, moving price</text></svg>`,
 double:()=>{ const v=[1,2,4,8], lab=['100','200','400','800'], ax=['Now','12 yrs','24 yrs','36 yrs'];
  return `<svg viewBox="0 0 320 200" class="vis" role="img" aria-label="Bars doubling every 12 years at 6 percent a year">`+v.map((n,i)=>{const h=n*13, x=46+i*66; return `<rect class="grow" style="animation-delay:${i*.18}s" x="${x}" y="${150-h}" width="42" height="${h}" rx="5" fill="var(--accent)" fill-opacity="${.35+i*.2}"/><text x="${x+21}" y="${144-h}" text-anchor="middle" class="t">${lab[i]}</text><text x="${x+21}" y="168" text-anchor="middle">${ax[i]}</text>`}).join('')+
  `<line x1="30" x2="300" y1="150" y2="150" stroke="var(--line)"/><text x="160" y="190" text-anchor="middle">100 grows at 6% a year. 72 ÷ 6 = 12</text></svg>`; },
 diversify:()=>{ const f=[.05,.07,.09,.06,.08], p=[0,1.7,3.1,4.4,5.6], A=[26,22,24,20,25]; const xs=[]; for(let x=20;x<=300;x+=4) xs.push(x);
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

/* ================= content ================= */
const TIPS=[
 {v:'seesaw',cat:'Bonds',t:'Yields up, bond prices down',d:'Existing bonds pay a fixed coupon, so when market yields rise their prices fall.',a:'bond-prices'},
 {v:'double',cat:'Basics',t:'The rule of 72',d:'Divide 72 by your yearly return to estimate the years it takes to double. At 6%, about 12.',a:'rule-of-72'},
 {v:'diversify',cat:'Basics',t:'Spread the risk',d:'Assets that do not move together smooth the total. It reduces risk, it does not remove it.',a:'diversification'},
 {v:'pe',cat:'Equities',t:'P/E in one grid',d:'A P/E of 20 means the price equals 20 years of today\'s earnings. Compare within a sector.',a:'pe-ratio'},
 {v:'curve',cat:'Bonds',t:'Three shapes of a yield curve',d:'Upward is normal. Inverted, with short yields above long ones, has often come before recessions.',a:'yield-curve'},
 {v:'fx',cat:'FX',t:'Base over quote',d:'In EUR/USD the rate is how many dollars one euro costs. A rising rate means a stronger euro.',a:'fx-pairs'},
 {v:'riskreturn',cat:'Basics',t:'Risk and reward travel together',d:'Higher expected returns usually come with bigger swings. Expected does not mean guaranteed.'},
 {v:'spread',cat:'Equities',t:'Bid, ask and the spread',d:'You buy at the ask and sell at the bid. The gap between them is a real cost of trading.',a:'spread'},
 {v:'vix',cat:'Macro',t:'The VIX is about swings, not direction',d:'It reflects the move options traders expect over 30 days, up or down.',a:'vix'},
 {v:'dca',cat:'Basics',t:'Steady buying',d:'A fixed sum on a schedule buys more shares when prices are low and fewer when they are high.'},
 {v:'inflation',cat:'Macro',t:'Cash loses buying power',d:'At 3% inflation, 100 buys in ten years what about 74 buys today.'}
];
const ARTICLES=[
 {id:'bond-prices',cat:'Bonds',read:3,v:'seesaw',t:'Why bond prices fall when yields rise',lede:'A bond\'s coupon is fixed. Its price is not, and the two move in opposite directions.',
  b:['Imagine a bond that pays 4 a year for every 100 you lend. When it was issued, 4% was what the market offered.','Now new bonds start paying 5%. Nobody will pay 100 for your 4% bond when 100 buys a 5% one, so its price has to drop until buying it gives a competitive return.','The reverse also holds. When market yields fall, older bonds with higher coupons become more valuable and their prices rise.','How far the price moves depends mostly on maturity. Long bonds react more than short ones, because you are locked into the old coupon for longer.'],
  k:'Rising yields lower the price of existing bonds. Longer maturity means a bigger move.'},
 {id:'yield-curve',cat:'Bonds',read:3,v:'curve',t:'How to read a yield curve',lede:'A yield curve plots what a government pays to borrow for different lengths of time.',
  b:['Normally you are paid more for lending for longer, so the curve slopes upward. A 10-year yield sits above a 2-year yield.','A flat curve means investors see little difference between short and long lending. An inverted curve means short-term yields are higher than long-term ones.','Inversions of the US 2-year and 10-year yields have often come before recessions, but the delay is long and variable. Treat it as a signal to watch, not a timer.','On Meridian, the US yields come from FRED, the data service of the Federal Reserve Bank of St. Louis.'],
  k:'Upward is normal, inverted is a warning sign, and none of it is a prediction.'},
 {id:'pe-ratio',cat:'Equities',read:3,v:'pe',t:'What a P/E ratio tells you',lede:'The price to earnings ratio compares a share\'s price with the profit behind it.',
  b:['Divide the share price by earnings per share. If a share costs 100 and the company earned 5 per share over the last year, the P/E is 20.','Another way to read it: at today\'s earnings, the price equals 20 years of profit. A higher P/E usually means investors expect faster growth, or they will pay more for stability.','A P/E means little alone. Compare it with companies in the same sector and with the company\'s own history. Negative earnings give no usable P/E.','Pair it with debt to equity and return on equity to see how the profit is made.'],
  k:'P/E is price divided by earnings. Compare within a sector, never in isolation.'},
 {id:'fx-pairs',cat:'FX',read:3,v:'fx',t:'How to read a currency pair',lede:'Every exchange rate is the price of one currency in another.',
  b:['In EUR/USD, the euro is the base currency and the dollar is the quote currency. A rate of 1.1000 means 1 euro costs 1.1000 dollars.','If the number rises, the base currency got stronger against the quote currency. If it falls, it got weaker.','Most pairs are quoted to four decimals, and the smallest standard move, a pip, is 0.0001. Pairs involving the Japanese yen use two decimals, so a pip is 0.01.','Meridian shows nine pairs built around the dollar, from EUR/USD to USD/JPY.'],
  k:'Base over quote. A rising rate means the base currency strengthened.'},
 {id:'diversification',cat:'Basics',read:3,v:'diversify',t:'Diversification in one picture',lede:'Spreading money across assets that do not move together smooths the ride.',
  b:['Each thin line in the picture is one investment that goes up and down. The thick line is a portfolio holding all of them equally. It swings far less than the individual lines.','That works because the investments do not peak and fall at the same time. The less they move together, the bigger the effect.','Diversification does not remove market risk. In a broad sell-off many assets fall together, so it reduces risk but does not end it.','The picture uses invented smooth waves to show the idea. It is not market data.'],
  k:'Different assets, different timing, smoother total. Not risk free.'},
 {id:'rule-of-72',cat:'Basics',read:2,v:'double',t:'The rule of 72',lede:'A quick way to estimate how long money takes to double.',
  b:['Divide 72 by the yearly return in percent. At 6% a year, money doubles in about 12 years. At 8% it takes about 9.','The rule is an approximation that works best for returns between about 6% and 10%. The exact doubling time at 6% is 11.9 years.','It works in reverse too. Dividing 72 by the years you want gives the rate you need. It also applies to costs: at 3% inflation, prices double in about 24 years.'],
  k:'72 divided by the rate gives the years to double.'},
 {id:'vix',cat:'Macro',read:3,v:'vix',t:'What the VIX actually measures',lede:'The VIX is often called the fear gauge. It measures expected movement, not direction.',
  b:['The VIX is calculated from S&P 500 option prices. It reflects the volatility investors expect over the next 30 days, annualised.','A higher VIX means the market is pricing larger swings in either direction. It tends to rise when stocks fall sharply, which is how it earned its nickname.','A low VIX means calm expectations, not safety. A high VIX is not a prediction that prices will fall.','Meridian shows the VIX from FRED, with its last updated date.'],
  k:'The VIX measures expected swings over 30 days, not whether prices go up or down.'},
 {id:'spread',cat:'Equities',read:2,v:'spread',t:'Bid, ask and the spread',lede:'Every traded asset has two prices at any moment.',
  b:['The bid is the highest price a buyer is currently offering. The ask is the lowest price a seller will accept. The gap between them is the spread.','If you buy right away you pay the ask, and if you sell right away you receive the bid. The spread is a real cost of trading.','Heavily traded assets usually have narrow spreads. Thinly traded ones have wide spreads, so costs can be much higher.'],
  k:'You buy at the ask and sell at the bid. The gap is a cost.'}
];
const QUOTES=[
 {q:'Be fearful when others are greedy, and be greedy when others are fearful.',w:'Warren Buffett',n:'Investor, 2008'},
 {q:'The investor\'s chief problem, and even his worst enemy, is likely to be himself.',w:'Benjamin Graham',n:'The Intelligent Investor'},
 {q:'Know what you own, and know why you own it.',w:'Peter Lynch',n:'Attributed'}
];
const artById=id=>ARTICLES.find(a=>a.id===id);
const CATS=['All','Bonds','Equities','FX','Macro','Basics'];
const tvis=(k)=>`<div class="tv">${VIS[k]()}</div>`;

/* ================= home: tips carousel ================= */
let tipsInit=false;
function initTips(){
  const tr=$('#tipTrack'); if(!tr) return;
  if(!tipsInit){ tipsInit=true;
    tr.innerHTML=TIPS.map((x,i)=>`<article class="tip">${tvis(x.v)}<div class="tb"><span class="tcat">${x.cat} · Tip ${pad(i+1)}</span><h3>${x.t}</h3><p>${x.d}</p>${x.a?`<a class="tl" href="#article-${x.a}">Read the explainer ${ARROW}</a>`:`<span class="tl" style="opacity:.0">.</span>`}</div></article>`).join('');
    const bar=$('#tipBar'); let endFired=false;
    const upd=()=>{ const m=tr.scrollWidth-tr.clientWidth; const f=m>0?tr.scrollLeft/m:0; bar.style.width=(12+88*f)+'%';
      if(m>0 && tr.scrollLeft>=m-6 && !endFired){ endFired=true; maybeNewsPop(); } };
    tr.addEventListener('scroll',upd,{passive:true}); upd();
    const step=()=>(tr.querySelector('.tip').offsetWidth+16);
    $('#tipPrev').onclick=()=>tr.scrollBy({left:-step(),behavior:REDUCE?'auto':'smooth'});
    $('#tipNext').onclick=()=>tr.scrollBy({left:step(),behavior:REDUCE?'auto':'smooth'});
    let drag=null;
    tr.addEventListener('pointerdown',e=>{ if(e.pointerType!=='mouse') return; drag={x:e.clientX,s:tr.scrollLeft,m:false}; });
    addEventListener('pointermove',e=>{ if(!drag) return; const dx=e.clientX-drag.x; if(Math.abs(dx)>4){ drag.m=true; tr.style.scrollSnapType='none'; tr.classList.add('dragging'); tr.scrollLeft=drag.s-dx; } });
    addEventListener('pointerup',()=>{ if(!drag) return; const m=drag.m; drag=null; tr.classList.remove('dragging'); tr.style.scrollSnapType=''; if(m){ const s=step(); tr.scrollTo({left:Math.round(tr.scrollLeft/s)*s,behavior:'smooth'}); } });
    tr.addEventListener('click',e=>{ if(tr._moved) e.preventDefault(); },true);
  }
}

/* ================= news page ================= */
let newsCat='All', qIdx=0, qTimer=null;
const feedItems=()=>Array.isArray(store.news)?store.news:[];
window.PortalData.setNews=items=>{ store.news=items; $('#feedState').textContent='connected'; if(page==='news') drawNews(); };
const ago=iso=>{ const d=new Date(iso); return isNaN(d)?'':d.toLocaleDateString('en-GB',{day:'numeric',month:'short'}); };
function topStories(){
  const f=feedItems();
  if(f.length) return f.slice(0,3).map(n=>({href:n.url,ext:true,tag:(n.category||'News'),meta:[n.source,ago(n.published_at)].filter(Boolean).join(' · '),t:n.title,d:n.summary||'',img:n.image_url}));
  return ARTICLES.slice(0,3).map(a=>({href:'#article-'+a.id,tag:a.cat+' · Explainer',meta:a.read+' min read',t:a.t,d:a.lede,v:a.v}));
}
function ncard(c,big){
  const media=c.v?tvis(c.v):`<div class="tv img" ${/^https:\/\//.test(c.img||'')?`style="background-image:url('${c.img}')"`:''}><span>${c.tag.split(' · ')[0]}</span></div>`;
  return `<a class="ncard rv" href="${c.href}" ${c.ext?'target="_blank" rel="noopener noreferrer"':''}>${media}<div class="tb"><span class="tcat">${c.tag}</span><h3>${c.t}</h3><p>${c.d}</p><span class="meta">${c.meta||''}</span></div></a>`;
}
function drawNews(){
  const f=feedItems(), list=ARTICLES.filter(a=>newsCat==='All'||a.cat===newsCat);
  $('#newsBody').innerHTML=`
  <div class="pg-h"><div class="eyebrow">News and insights</div>
    <h1 class="two fx">Read the market. <span class="dim">Not the noise.</span></h1>
    <p class="lede">Market headlines that matter, and plain-language explainers on how finance and trading work.</p></div>
  ${f.length?'':`<div class="notice rv"><b>Live headlines are not connected yet.</b> Once the Finnhub feed is on, the most important market stories appear here, balanced between positive and negative, and each one is removed after two weeks. Until then, this page shows our explainers.</div>`}
  <div class="sh rv"><h3>Top stories</h3></div>
  <div class="ngrid">${topStories().map(c=>ncard(c)).join('')}</div>
  <div class="sh rv" style="margin-top:56px"><h3>Explainers</h3><div class="chips" id="ncats" role="group" aria-label="Category">${CATS.map(c=>`<button class="chip" data-ncat="${c}" aria-pressed="${c===newsCat}">${c}</button>`).join('')}</div></div>
  <div class="ngrid">${list.map(a=>ncard({href:'#article-'+a.id,tag:a.cat,meta:a.read+' min read',t:a.t,d:a.lede,v:a.v})).join('')}</div>
  <div class="sh rv" style="margin-top:56px"><h3>Words from investors</h3></div>
  <div class="qbox rv"><div id="qBody"></div><div class="qdots" id="qDots">${QUOTES.map((_,i)=>`<button data-q="${i}" aria-label="Quote ${i+1}"></button>`).join('')}</div></div>
  <div class="ctabox rv"><div><h3>Get the Sunday brief</h3><p>One email a week with the market-moving stories and a lesson at your level.</p></div><a class="b solid lg" href="#brief">Join the brief ${ARROW}</a></div>`;
  setQuote(qIdx,true); clearInterval(qTimer); qTimer=setInterval(()=>{ if(page==='news') setQuote((qIdx+1)%QUOTES.length); },7000);
  setupReveals();
}
function setQuote(i,first){
  qIdx=i; const q=QUOTES[i], box=$('#qBody'); if(!box) return;
  box.classList.remove('qin'); void box.offsetWidth;
  box.innerHTML=`<blockquote>${q.q}</blockquote><p class="qa"><b>${q.w}</b> · ${q.n}</p>`; box.classList.add('qin');
  $$('#qDots button').forEach((b,k)=>b.setAttribute('aria-current',k===i));
}
$('#p-news').addEventListener('click',e=>{
  const c=e.target.closest('[data-ncat]'); if(c){ newsCat=c.dataset.ncat; drawNews(); return; }
  const q=e.target.closest('[data-q]'); if(q){ setQuote(+q.dataset.q); }
});

/* ================= article page ================= */
function drawArticle(){
  const a=artById(artId); if(!a) return;
  const rel=ARTICLES.filter(x=>x.id!==a.id).sort((x,y)=>(y.cat===a.cat)-(x.cat===a.cat)).slice(0,2);
  $('#artBody').innerHTML=`<div class="art">
    <a class="back" href="#news">← All news and insights</a>
    <div class="eyebrow" style="margin-top:22px">${a.cat} · ${a.read} min read</div>
    <h1 class="fx" style="margin:12px 0 16px">${a.t}</h1>
    <p class="lede">${a.lede}</p>
    <div class="artvis">${VIS[a.v]()}</div>
    ${a.b.map(p=>`<p class="ap">${p}</p>`).join('')}
    <div class="take"><b>Key takeaway</b><p>${a.k}</p></div>
    <div class="artact"><button class="b" id="copyLink">Copy link</button><a class="b solid" href="#brief">Get the Sunday brief ${ARROW}</a></div>
    <p class="note" style="margin-top:20px">Educational information only. It is not financial advice or a recommendation to buy or sell any security.</p>
    <div class="sh" style="margin-top:44px"><h3>Keep reading</h3></div>
    <div class="ngrid two">${rel.map(r=>ncard({href:'#article-'+r.id,tag:r.cat,meta:r.read+' min read',t:r.t,d:r.lede,v:r.v})).join('')}</div></div>`;
  setupReveals();
}
$('#p-article').addEventListener('click',e=>{ if(e.target.closest('#copyLink')){ try{ navigator.clipboard.writeText(location.href).then(()=>toast('Link copied'),()=>toast('Copy the link from the address bar.')); }catch(err){ toast('Copy the link from the address bar.'); } } });

/* ================= pop-ups: a tip after one minute, reads after a long scroll ================= */
const ss={ get(k){ try{return sessionStorage.getItem(k);}catch(e){return null;} }, set(k,v){ try{sessionStorage.setItem(k,v);}catch(e){} } };
let popTipI=0;
const popT={}, POP_MS=20000;
function popArm(id,ms){ clearTimeout(popT[id]); popT[id]=setTimeout(()=>{ if(!$('#'+id).hidden) popClose(id); },ms||POP_MS); }
function popOpen(id){ const el=$('#'+id); el.hidden=false; requestAnimationFrame(()=>requestAnimationFrame(()=>el.classList.add('show'))); popArm(id); }
function popClose(id){ clearTimeout(popT[id]); const el=$('#'+id); el.classList.remove('show'); setTimeout(()=>{ if(!el.classList.contains('show')) el.hidden=true; },450); }
['tipPop','newsPop'].forEach(id=>{ const el=$('#'+id);
  el.addEventListener('mouseenter',()=>clearTimeout(popT[id])); el.addEventListener('focusin',()=>clearTimeout(popT[id]));
  el.addEventListener('mouseleave',()=>{ if(!el.hidden) popArm(id,8000); }); el.addEventListener('focusout',()=>{ if(!el.hidden) popArm(id,8000); }); });
function renderTipPop(){
  const T=TIPS[popTipI];
  $('#tipPop').innerHTML=`<button class="x" id="tpX" aria-label="Close tip">×</button>
    <div class="ph"><span class="tcat">A tip while you are here · ${pad(popTipI+1)} of ${TIPS.length}</span></div>
    <div class="pv">${VIS[T.v]()}</div>
    <h4>${T.t}</h4><p>${T.d}</p>
    <div class="prow"><div class="pnav"><button id="tpP" aria-label="Previous tip">‹</button><button id="tpN" aria-label="Next tip">›</button></div>
      ${T.a?`<a class="plink" href="#article-${T.a}">Read more</a>`:''}<a class="b solid sm" href="#brief" id="tpJ">Join the brief</a></div>`;
}
function showTipPop(){ popClose('newsPop'); renderTipPop(); popOpen('tipPop'); ss.set('mgm-tip','1'); }
$('#tipPop').addEventListener('click',e=>{
  if(e.target.closest('#tpX')){ popClose('tipPop'); return; }
  if(e.target.closest('#tpP')){ popTipI=(popTipI+TIPS.length-1)%TIPS.length; renderTipPop(); return; }
  if(e.target.closest('#tpN')){ popTipI=(popTipI+1)%TIPS.length; renderTipPop(); return; }
  if(e.target.closest('a')) popClose('tipPop');
});
function newsPopItems(){ const f=feedItems(); if(f.length) return f.slice(0,3).map(n=>({href:n.url,ext:true,tag:n.category||'News',t:n.title}));
  return ARTICLES.slice(0,3).map(a=>({href:'#article-'+a.id,tag:a.cat+' · Explainer',t:a.t})); }
function maybeNewsPop(){
  if(ss.get('mgm-news')||page!=='home'||!$('#tipPop').hidden) return;
  $('#newsPop').innerHTML=`<button class="x" id="npX" aria-label="Close">×</button><div class="ph"><span class="tcat">Worth reading</span></div>
    ${newsPopItems().map(i=>`<a class="nitem" href="${i.href}" ${i.ext?'target="_blank" rel="noopener noreferrer"':''}><span class="tcat">${i.tag}</span><b>${i.t}</b></a>`).join('')}
    <div class="prow"><a class="b solid sm" href="#news" id="npAll">Open the news page</a><a class="plink" href="#brief">Join the brief</a></div>`;
  popOpen('newsPop'); ss.set('mgm-news','1');
}
$('#newsPop').addEventListener('click',e=>{ if(e.target.closest('#npX')||e.target.closest('a')) popClose('newsPop'); });
addEventListener('scroll',()=>{ if(page!=='home'||ss.get('mgm-news')) return; const r=(scrollY+innerHeight)/document.documentElement.scrollHeight; if(r>=.74) maybeNewsPop(); },{passive:true});
(function tipTimer(){
  if(ss.get('mgm-tip')) return;
  const fire=()=>{ if(ss.get('mgm-tip')) return; if(document.hidden){ document.addEventListener('visibilitychange',function f(){ if(!document.hidden){ document.removeEventListener('visibilitychange',f); fire(); } }); return; } showTipPop(); };
  setTimeout(fire,TIP_DELAY);
})();


/* ================= heatmap (Finviz-style treemap) ================= */
let hmView='idx';
const HM_VIEWS={idx:'Indices',fx:'Currencies',bond:'Bonds'};
const regionOf=h=>h.tz.startsWith('America')?'Americas':h.tz.startsWith('Europe')?'Europe':'Asia-Pacific';
function hmItems(){
  if(hmView==='fx'){ const seen={}; return HUBS.filter(h=>!seen[h.fx]&&(seen[h.fx]=1)).map(h=>({id:h.id,name:h.fx,sub:h.name,reg:regionOf(h),v:store[h.id]&&store[h.id].fx})); }
  return HUBS.map(h=>({id:h.id,name:hmView==='bond'?h.bond.replace(' 10-year','').replace(' gilt',''):h.idx,sub:hmView==='bond'?'10-year · '+h.name:h.name,reg:regionOf(h),v:store[h.id]&&store[h.id][hmView]}));
}
const hmChg=v=>v&&typeof v==='object'&&v.chg!=null?Number(v.chg):null;
function squarify(items,x,y,w,h){
  const out=[], tot=items.reduce((s,i)=>s+i.w,0); if(!tot||w<=0||h<=0) return out;
  let rest=items.slice().sort((p,q)=>q.w-p.w).map(i=>({i,a:i.w/tot*w*h}));
  const worst=(row,side)=>{ const s=row.reduce((t,r)=>t+r.a,0), mx=Math.max(...row.map(r=>r.a)), mn=Math.min(...row.map(r=>r.a)); return Math.max(side*side*mx/(s*s),s*s/(side*side*mn)); };
  while(rest.length){
    const side=Math.min(w,h); let row=[rest[0]], k=1;
    while(k<rest.length && worst(row.concat(rest[k]),side)<=worst(row,side)){ row.push(rest[k]); k++; }
    const s=row.reduce((t,r)=>t+r.a,0);
    if(w>=h){ const cw=s/h; let cy=y; row.forEach(r=>{ const ch=r.a/cw; out.push({i:r.i,x,y:cy,w:cw,h:ch}); cy+=ch; }); x+=cw; w-=cw; }
    else { const ch=s/w; let cx=x; row.forEach(r=>{ const cw=r.a/ch; out.push({i:r.i,x:cx,y,w:cw,h:ch}); cx+=cw; }); y+=ch; h-=ch; }
    rest=rest.slice(k);
  }
  return out;
}
function hmColor(c){ if(c==null) return ''; const p=22+Math.min(Math.abs(c)/3,1)*62; return `background:color-mix(in srgb,var(${c>=0?'--up':'--down'}) ${p}%,var(--surface2));color:var(--text)`; }
function heatHTML(){
  const items=hmItems().map(i=>({...i,c:hmChg(i.v),w:(i.v&&typeof i.v==='object'&&i.v.w>0)?i.v.w:1}));
  const W=1000,H=520,G=26, regs=['Americas','Europe','Asia-Pacific'].map(r=>({r,w:items.filter(i=>i.reg===r).reduce((s,i)=>s+i.w,0)})).filter(g=>g.w>0);
  const groups=squarify(regs.map(g=>({...g})),0,0,W,H);
  let html='';
  groups.forEach(g=>{
    const its=items.filter(i=>i.reg===g.i.r), box={x:g.x,y:g.y+G,w:g.w,h:g.h-G};
    html+=`<div class="hmg" style="left:${g.x/W*100}%;top:${g.y/H*100}%;width:${g.w/W*100}%;height:${g.h/H*100}%"><span class="hmr">${g.i.r}</span></div>`;
    squarify(its.map(i=>({...i})),box.x,box.y,box.w,box.h).forEach(c=>{ const i=c.i;
      html+=`<button type="button" class="hmt ${i.c==null?'na':''}" data-id="${i.id}" data-d="${i.name} · ${i.sub} · ${i.c==null?'awaiting feed':(i.c>0?'+':'')+i.c.toFixed(2)+'%'}" style="left:${c.x/W*100}%;top:${c.y/H*100}%;width:${c.w/W*100}%;height:${c.h/H*100}%;${hmColor(i.c)}"><b>${i.name}</b><small>${i.sub}</small><span class="mono">${i.c==null?'—':(i.c>0?'+':'')+i.c.toFixed(2)+'%'}</span></button>`; });
  });
  const chips=Object.keys(HM_VIEWS).map(k=>`<button type="button" data-hv="${k}" aria-pressed="${k===hmView}">${HM_VIEWS[k]}</button>`).join('');
  return `<div class="hmbar"><div class="seg" role="tablist" aria-label="Heatmap view">${chips}</div>
    <div class="hmleg" aria-hidden="true"><span>−3%</span><i></i><span>+3%</span></div></div>
    <div class="hm" role="group" aria-label="Market heatmap">${html}</div>
    <p class="note" id="hmRead" style="margin-top:12px">Hover a tile for details, click to open that market. Tiles stay neutral until the feed is connected. Colour shows the daily move; size is equal until market-cap weights are supplied.</p>`;
}
function drawHeat(){ const h=$('#hmHome'); if(h) h.innerHTML=heatHTML(); if(mtab==='heat'&&page==='markets'){ const b=$('#mBody'); if(b) b.innerHTML=heatHTML(); } }
function tabHeat(){ return heatHTML(); }
document.addEventListener('click',e=>{
  const v=e.target.closest('[data-hv]'); if(v){ hmView=v.dataset.hv; drawHeat(); return; }
  const t=e.target.closest('.hmt'); if(t){ select(t.dataset.id,true); location.hash='#markets'; }
});
document.addEventListener('pointerover',e=>{ const t=e.target.closest&&e.target.closest('.hmt'); if(t){ const r=document.getElementById('hmRead'); if(r&&r.closest('.hmwrap, #mBody')) r.textContent=t.dataset.d; } });

/* ================= forms and misc ================= */
['mailForm','homeForm'].forEach(id=>$('#'+id).addEventListener('submit',e=>{ e.preventDefault(); toast('Preview only. Nothing was sent and nothing was stored.'); }));
$('#login').onclick=()=>toast('Sign in arrives with Supabase Auth.');
document.addEventListener('click',e=>{ const s=e.target.closest('[data-soon]'); if(s){ e.preventDefault(); toast(`${s.dataset.soon} arrives after the first release.`); } });
$('#dX').onclick=$('#dUp').onclick=()=>$('#scrim').classList.remove('on');
$('#scrim').addEventListener('click',e=>{ if(e.target.id==='scrim') $('#scrim').classList.remove('on'); });
addEventListener('keydown',e=>{
  if(e.key==='Escape'){ $('#scrim').classList.remove('on'); $('#more').classList.remove('open'); if(!$('#tipPop').hidden) popClose('tipPop'); if(!$('#newsPop').hidden) popClose('newsPop'); }
  if(e.target.matches('input,select,textarea')||e.metaKey||e.ctrlKey||e.altKey) return;
  const k=e.key.toLowerCase();
  if(page==='markets'||page==='home'){
    if(k==='e'||k==='b'||k==='f'){ layers[{e:'eq',b:'bd',f:'fx'}[k]]^=1; if(page==='markets') drawMarkets(false); }
    else if(e.key==='ArrowRight') cycle(1); else if(e.key==='ArrowLeft') cycle(-1);
  }
});

/* ================= clocks and loop ================= */
setInterval(()=>{ drawHubInfo(); if(page==='markets') drawMarkets(false); },30000);
(function loop(){
  const now=Date.now();
  if(page==='home'){ g1.frame(now); const r=$('#ctaSec').getBoundingClientRect(); if(r.top<innerHeight && r.bottom>0) waveFrame(performance.now()); }
  else if(page==='markets') g2.frame(now);
  requestAnimationFrame(loop);
})();

/* boot */
select('lon',true); g1.yaw=g2.yaw=lonHome*RAD; g1.ty=g2.ty=null;
(document.fonts&&document.fonts.ready?document.fonts.ready:Promise.resolve()).then(()=>{ moveInd(); g1.resize(); });
route();
addEventListener('load',()=>{ moveInd(); g1.resize(); g2.resize(); });

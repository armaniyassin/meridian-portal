/* ================= time helpers ================= */
const fmtCache = {};
function parts(tz, t){
  const f = fmtCache[tz] || (fmtCache[tz] = new Intl.DateTimeFormat('en-GB',{timeZone:tz,hour:'2-digit',minute:'2-digit',weekday:'short',hourCycle:'h23'}));
  const p = {}; f.formatToParts(new Date(t)).forEach(x=>p[x.type]=x.value);
  return {wd:p.weekday, min:(+p.hour)*60 + (+p.minute)};
}
function isOpen(h, t){
  const p = parts(h.tz, t);
  if (p.wd==='Sat' || p.wd==='Sun') return false;
  return p.min >= h.o && p.min < h.c;
}
function openCount(t){ return HUBS.reduce((n,h)=>n+(isOpen(h,t)?1:0),0); }
function nextChange(h, t){ // minutes until the status flips, scanning in 5-minute steps
  const s = isOpen(h,t);
  for (let m=5; m<=60*24*5; m+=5){ if (isOpen(h,t+m*60000)!==s) return {open:s, mins:m}; }
  return {open:s, mins:null};
}
function human(m){ if(m==null) return ''; const d=Math.floor(m/1440), hh=Math.floor((m%1440)/60), mm=m%60;
  return (d?d+'d ':'') + (hh?hh+'h ':'') + (!d?mm+'m':'').trim(); }
const pad = n => String(n).padStart(2,'0');
function localClock(tz,t){ return new Intl.DateTimeFormat('en-GB',{timeZone:tz,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(t)); }


// @ts-nocheck
// Canvas globe ported from the approved prototype (see docs/adr/0001). Browser-only: load with a dynamic import.
import { HUBS, isOpen, nextChange, humanMinutes as human, pad } from "@/lib/hubs";
export const RAD = Math.PI / 180;

/* ================= coarse land outlines [lon,lat]; rasterised to dots at load ================= */
const LAND = [
 // North America
 [[-168,66],[-162,70],[-156,71],[-141,70],[-128,70],[-115,68],[-95,72],[-85,70],[-82,66],[-94,60],[-93,57],[-85,55],[-80,52],[-79,57],[-77,62],[-70,60],[-65,60],[-61,56],[-56,52],[-60,47],[-66,45],[-70,43],[-70,41.5],[-74,40],[-76,37],[-76,35],[-81,31],[-80,26],[-81,25],[-83,29],[-85,30],[-89,30],[-94,29.5],[-97,26],[-97.5,22],[-96,19],[-91,18.5],[-90,21],[-87,21.5],[-88,16],[-84,15.5],[-83,10],[-80,9],[-77.5,8.5],[-79,7.5],[-81,8],[-85,10],[-87,13],[-92,14.5],[-96,15.8],[-102,18],[-105.5,20.5],[-105,23],[-109,26],[-112.5,31],[-114.7,31.5],[-112,27],[-110,23],[-109.5,23],[-112,25],[-115,29],[-117,32.5],[-120.5,34.5],[-122.5,37.5],[-124,40.5],[-124.5,46],[-124,48.5],[-128,51],[-131,54.5],[-135,58],[-140,60],[-148,60.5],[-152,59],[-158,57],[-163,55],[-157,58.5],[-162,60],[-165,62],[-166,65]],
 [[-73,78],[-60,82],[-30,83.5],[-20,80],[-20,75],[-22,70],[-32,68],[-41,63],[-44,60],[-50,62],[-53,67],[-58,75]],
 [[-80,73.5],[-68,70],[-62,66.5],[-66,62],[-72,64],[-78,64.5],[-90,70]],
 [[-118,73],[-105,73],[-101,69],[-115,69]],
 [[-90,80],[-62,82.5],[-75,78.5],[-90,76.5]],
 [[-85,22],[-80,23],[-74,20],[-78,20]],
 [[-74,19.8],[-69,19.8],[-68.5,18.4],[-74,18]],
 // South America
 [[-77.5,8.5],[-72,12],[-68,10.5],[-62,10.5],[-57,6],[-52,5],[-50,0],[-48,-1],[-44,-2.5],[-39,-3.5],[-35,-5.5],[-35,-9],[-38.5,-13],[-39,-18],[-41,-22],[-45,-23.5],[-48.5,-26],[-48.5,-28.5],[-52,-32],[-54,-34.5],[-57,-35],[-57,-38],[-62,-39],[-65,-41],[-64,-43],[-66,-45.5],[-67.5,-47],[-66,-50],[-69,-51.5],[-68.5,-54],[-72,-54],[-75,-50],[-74,-44],[-73.5,-38],[-71.5,-30],[-70.5,-23],[-70.5,-18.5],[-76,-14],[-79,-8],[-81,-5],[-80,-2],[-80.5,0],[-78.5,2],[-77.5,6]],
 // Eurasia
 [[-9,43.5],[-1.5,43.5],[-1.5,46],[-4.5,48.5],[-1.5,48.8],[1.5,50.5],[4,51.5],[5,53.3],[8.5,54],[8.5,57],[10.5,57.5],[10.5,55],[12,54.2],[14,54],[19,54.5],[21,57],[24,57.3],[24,59.3],[29,60],[22.5,60],[21.5,63],[25,65.5],[22,65.8],[17.5,62],[18.5,59.5],[16.5,56.5],[13,55.5],[11.5,59],[8,58],[5,59],[5,62],[10,64],[14.5,68],[19,70],[25,71],[31,70],[33,69],[41,67],[34,66],[40,64.5],[44,66],[44,68.5],[54,68.5],[60,69],[68,69],[69,73],[75,72.5],[80,73.5],[87,75],[100,77.5],[105,77.5],[113,74],[125,73.5],[140,72.5],[150,71.5],[160,70],[170,70],[180,69],[180,65],[178,64.5],[172,64],[177,62.5],[165,60],[163,58],[162,56],[156,51],[156,57],[160,61],[155,59],[143,59.5],[136,54.5],[141,52.5],[140,48],[135,43.5],[131,42.5],[129.5,41],[128,39],[129.5,36],[126.5,34.5],[126.5,37.5],[125,39.5],[121.5,39],[122,40.5],[119,39],[118,38],[122.5,37],[119,35],[121.5,32],[121.5,30],[122,29],[119.5,25.5],[117,23.5],[113,22],[110,21],[108,21.5],[106.5,19],[109,15],[109,12],[105,8.7],[104.5,10.5],[100.5,13.5],[100,9],[102,6],[104,1.5],[101,3],[98.5,8],[98.5,12],[97.5,16.5],[94.5,16],[94,19],[91.5,22.5],[89,21.8],[86.5,20],[84.5,18.5],[82,16.5],[80.2,15],[80.2,10],[78,8.5],[77,8],[76,10],[74.5,14.5],[73,17.5],[72.8,21],[70,21],[68.5,23.5],[66.5,25],[62,25],[57.5,25.7],[56.5,27],[54,26.7],[51,28],[48.5,30],[48,29],[50,26],[50.5,25],[51.5,24.5],[56,24.5],[56.5,26],[58,23.5],[59.5,22.5],[57,19],[52,16],[45,13],[43,13],[42.5,16],[39,21.5],[35,28],[34.5,28],[32.5,30],[34.5,31.3],[35.5,34],[36,36.5],[33,36],[30,36.3],[28,36.7],[26.5,38.5],[26.5,40],[24,40.8],[23,40],[24,38],[22.8,36.5],[21.5,37],[21,39],[19.5,41.5],[18.5,42.5],[16,43.5],[13.8,45.2],[12.3,45.3],[13.5,43.6],[16,41.8],[18.5,40.2],[16.5,38.5],[16,38],[15.7,40],[13,41.2],[10.5,43],[8.8,44.4],[6,43],[3.2,43.2],[3,42],[0,40],[-0.5,38.5],[-2,36.8],[-5.5,36],[-9,37],[-9,39],[-8.8,41.5]],
 // Africa
 [[-17,21],[-16.5,24],[-13,27.5],[-9.7,30],[-9.5,32.5],[-6.5,35.8],[-2,35.2],[3,36.8],[10,37.2],[11,35],[10,33.5],[15,32.3],[20,32],[20,30.5],[25,31.8],[32,31.3],[34,31.2],[32.5,30],[34,27.5],[35,24],[37,21],[39,16],[43,12.5],[44,10.5],[51,11.8],[51,10],[48,5],[42,-1],[40,-3],[39,-6],[40.5,-10.5],[40.5,-15],[35,-20],[35.5,-24],[32.5,-26],[32,-29],[28,-33],[25,-34],[20,-34.8],[18.3,-34],[17.5,-30.5],[15,-26.5],[14,-22],[12,-17.5],[13.5,-12],[12,-6],[9,-1],[9.5,3.5],[6,4.3],[4,6.3],[-2,4.8],[-8,4.5],[-12,7.5],[-14.5,10.5],[-17,14.7],[-16.5,19]],
 [[44,-25],[47,-25],[50,-15.5],[49.5,-12],[47,-15],[44,-17],[43.5,-22]],
 // islands
 [[130.8,31],[132,34],[135,34],[137,34.6],[140,35],[141,38],[142,40],[141,41.5],[139.8,40],[139.5,37],[136.5,36.5],[133,35.5],[131,34.5]],
 [[140,42],[141.5,45.4],[145,43.3],[143,42]],
 [[142,46],[143.5,49],[143,54],[142,54]],
 [[-5.5,50],[1.5,51],[1.7,52.8],[0,54],[-1.5,55.5],[-2,57.5],[-4,58.6],[-6,58],[-5.5,56],[-5,54.8],[-3,54],[-4.5,53.3],[-5,52],[-3,51.5]],
 [[-10,51.8],[-6,52],[-6,54.5],[-8,55.2],[-10,54]],
 [[-24,65.5],[-18,66.3],[-13.5,65],[-18,63.4],[-22.5,63.8]],
 [[52,71],[57,70.5],[68,76.5],[60,76.5]],
 [[95.3,5.5],[98,4],[104,-1],[106,-3],[105.8,-5.8],[102,-4],[98,0.5]],
 [[109,1.5],[111,2],[117,7],[119,5],[118,1],[116.5,-3.5],[114,-4],[111,-3],[109,-1.5]],
 [[105.3,-6.8],[108,-6.5],[114,-7.6],[114.5,-8.7],[106,-7.5]],
 [[119,-5.5],[120.5,-3],[121,1],[125,1.5],[123,0],[122,-4.5],[121,-5],[119.5,-5.5]],
 [[131,-1],[135,-3.3],[141,-2.6],[147,-6],[150,-10],[146,-8.5],[143,-9],[138,-8],[135,-4.5],[132,-2.8]],
 [[120,18.5],[122.3,18.5],[122,14],[124,13],[121,13.5],[120,16]],
 [[122,7],[126,9.5],[126.5,6.5],[125.5,5.8],[123,7.5]],
 [[120,23],[121.5,25],[122,24.5],[120.8,22]],
 [[79.8,9.5],[81.8,7.5],[80.5,6],[79.8,7.5]],
 [[114,-22],[114,-26],[115,-34],[118,-35],[123.5,-34],[129,-31.5],[132,-32],[135.5,-34.8],[138,-35.5],[140,-38],[144,-38.5],[147,-38.3],[150,-37.3],[153,-31],[153.5,-27],[150,-22.5],[146,-19],[145,-15],[143.5,-14],[142.5,-10.8],[141.5,-13],[141,-17],[139,-17.5],[136.5,-15.5],[137,-12.3],[132,-11.3],[130,-12.5],[129,-14.8],[126,-14],[122.5,-17],[121,-19.5],[117,-20.7]],
 [[145,-41],[148,-41],[147,-43.5],[145.5,-42.8]],
 [[172.7,-34.5],[175.5,-37],[178.5,-37.7],[175,-41.5],[173.5,-39.5],[174.5,-37]],
 [[172.7,-40.5],[174.3,-41.7],[171,-44.5],[169,-46.6],[166.5,-46],[168,-44]],
 // Antarctica
 [[-180,-90],[180,-90],[180,-72],[150,-70],[120,-66],[90,-66],[60,-67],[30,-70],[0,-70],[-30,-72],[-60,-75],[-62,-68],[-70,-72],[-100,-73],[-130,-74],[-160,-78],[-180,-78]]
];
const WATER = [
 [[27.8,41.8],[28.5,43.5],[30,45.3],[33.5,46.2],[35,45.2],[38,47],[39.5,45],[37.5,44.3],[41.5,41.8],[36,41.5],[31,41.2]],
 [[47,45],[50,46.5],[53,46.5],[53,43],[51,41],[53.5,40],[54,37],[51,36.7],[49,38.5],[49,40.5],[47.5,43]]
];
function inPoly(x,y,poly){ let c=false; for(let i=0,j=poly.length-1;i<poly.length;j=i++){ const a=poly[i], b=poly[j];
  if(((a[1]>y)!==(b[1]>y)) && (x < (b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])) c=!c; } return c; }
const bbox = poly => { let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9; poly.forEach(p=>{x0=Math.min(x0,p[0]);x1=Math.max(x1,p[0]);y0=Math.min(y0,p[1]);y1=Math.max(y1,p[1]);}); return [x0,x1,y0,y1]; };
const LB = LAND.map(bbox), WB = WATER.map(bbox);
function isLand(lon,lat){
  let land=false;
  for(let i=0;i<LAND.length;i++){ const b=LB[i]; if(lon<b[0]||lon>b[1]||lat<b[2]||lat>b[3]) continue; if(inPoly(lon,lat,LAND[i])){land=true;break;} }
  if(!land) return false;
  for(let i=0;i<WATER.length;i++){ const b=WB[i]; if(lon<b[0]||lon>b[1]||lat<b[2]||lat>b[3]) continue; if(inPoly(lon,lat,WATER[i])) return false; }
  return true;
}

/* point cloud on a Fibonacci sphere */
const N = 16000, GA = Math.PI*(3-Math.sqrt(5));
const landPts = [], seaPts = [];
for(let i=0;i<N;i++){
  const y = 1 - 2*(i+.5)/N, lat = Math.asin(y)/RAD, lon = ((i*GA)/RAD % 360 + 540) % 360 - 180;
  const o = {lat:lat*RAD, lon:lon*RAD, sl:Math.sin(lat*RAD), cl:Math.cos(lat*RAD)};
  (isLand(lon,lat) ? landPts : seaPts).push(o);
}
const sea = seaPts.filter((_,i)=>i%4===0);

/* sun position from UTC clock */
function sunPos(t){
  const d = new Date(t), start = Date.UTC(d.getUTCFullYear(),0,0), doy = (t-start)/86400000;
  const dec = 23.44*Math.sin(2*Math.PI*(doy-81)/365)*RAD;
  const h = d.getUTCHours()+d.getUTCMinutes()/60+d.getUTCSeconds()/3600;
  return {lat:dec, lon:-(h-12)*15*RAD};
}

/* ================= Globe class ================= */
export class Globe{
  constructor(canvas, o){
    this.c=canvas; this.x=canvas.getContext('2d'); this.o=o;
    this.yaw=o.yaw||0; this.pitch=o.pitch||.35; this.ty=null; this.tp=null;
    this.vel=0; this.drag=false; this.idle=0; this.hover=null; this.active=null; this.scale=1;
    this.reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.resize(); new ResizeObserver(()=>this.resize()).observe(canvas.parentElement);
    if(o.interactive) this.bind();
  }
  resize(){
    const r=this.c.parentElement.getBoundingClientRect(), d=Math.min(devicePixelRatio||1,2);
    this.w=r.width; this.h=r.height; this.c.width=this.w*d; this.c.height=this.h*d; this.d=d;
    this.R=this.o.R?this.o.R(this.w,this.h):Math.min(this.w,this.h)*(this.o.r??.4); this.cx=this.w*(this.o.cx??.5); this.cy=this.o.cyPx?this.o.cyPx(this.R,this.w,this.h):this.h*(this.o.cy??.5);
  }
  focus(lonDeg,latDeg){ this.ty=lonDeg*RAD; this.tp=this.o.fp?this.o.fp(latDeg):Math.max(-1.25,Math.min(.6,(latDeg-45)*RAD)); this.idle=240; }
  project(lat,lon){
    const dl=lon-this.yaw, cl=Math.cos(lat), sl=Math.sin(lat), cp=Math.cos(this.pitch), sp=Math.sin(this.pitch);
    return {x:cl*Math.sin(dl), y:cp*sl - sp*cl*Math.cos(dl), z:sp*sl + cp*cl*Math.cos(dl)};
  }
  bind(){
    const c=this.c; let lx=0, ly=0, moved=0;
    c.addEventListener('pointerdown',e=>{ this.drag=true; lx=e.clientX; ly=e.clientY; moved=0; c.setPointerCapture(e.pointerId); c.classList.add('drag'); this.ty=null; });
    c.addEventListener('pointermove',e=>{
      const r=c.getBoundingClientRect(), mx=e.clientX-r.left, my=e.clientY-r.top;
      this.mx=mx; this.my=my;
      if(this.drag){ this.hover=null; const dx=e.clientX-lx, dy=e.clientY-ly; lx=e.clientX; ly=e.clientY; moved+=Math.abs(dx)+Math.abs(dy);
        this.yaw -= dx/(this.R)*0.9; this.vel=-dx/(this.R)*0.9; this.pitch=Math.max(-1.25,Math.min(.8,this.pitch+dy/this.R*.6)); this.idle=300; }
      else this.hover=this.pick(mx,my);
      c.style.cursor = this.drag?'grabbing':(this.hover?'pointer':'grab');
    });
    const up=e=>{ if(!this.drag) return; this.drag=false; c.classList.remove('drag');
      if(moved<5){ const r=c.getBoundingClientRect(), h=this.pick(e.clientX-r.left,e.clientY-r.top); if(h) this.o.onPick(h); } };
    c.addEventListener('pointerup',up); c.addEventListener('pointercancel',()=>{this.drag=false;c.classList.remove('drag');});
    c.addEventListener('pointerleave',()=>{this.hover=null; this.mx=null;});
  }
  pick(mx,my){
    let best=null, bd=18;
    for(const h of HUBS){ const p=this.project(h.lat*RAD,h.lon*RAD); if(p.z<.05) continue;
      const sx=this.cx+p.x*this.R*this.scale, sy=this.cy-p.y*this.R*this.scale, d=Math.hypot(sx-mx,sy-my); if(d<bd){bd=d;best=h;} }
    return best;
  }
  card(h,sx,sy,t,P,al){
    const x=this.x, mk=Math.floor(t/60000), c=this._nc||(this._nc={});
    if(!c[h.id]||c[h.id].mk!==mk) c[h.id]={mk, nc:nextChange(h,t)};
    const nc=c[h.id].nc, open=nc.open, hm=m=>pad(Math.floor(m/60))+':'+pad(m%60);
    const SANS=window.__sans||'system-ui,sans-serif';
    // everything below the title is in the VISITOR'S time zone, except the market's own local hours
    const day=d=>new Intl.DateTimeFormat('en-GB',{year:'numeric',month:'numeric',day:'numeric'}).format(d);
    const hhmm=d=>new Intl.DateTimeFormat('en-GB',{hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(d);
    let when='';
    if(nc.at!=null){ const d=new Date(nc.at), same=day(d)===day(new Date(t));
      when=(same?'Today':new Intl.DateTimeFormat('en-GB',{weekday:'short'}).format(d))+' '+hhmm(d)+' your time'; }
    const stat=open?'Open':'Closed', main=nc.mins!=null?(open?'Closes in ':'Opens in ')+human(nc.mins):stat;
    const foot='Hours '+hm(h.o)+'–'+hm(h.c)+' local  ·  Your time '+hhmm(new Date(t));
    x.font='600 12px '+SANS; const wN=x.measureText(h.name).width;
    x.font='500 11px '+SANS; const wS=x.measureText(stat).width;
    x.font='600 15px '+SANS; const wM=x.measureText(main).width;
    x.font='500 11.5px '+SANS; const wW=x.measureText(when).width;
    x.font='400 10.5px '+SANS; const wF=x.measureText(foot).width;
    const w=Math.ceil(Math.max(wN+wS+22,wM,wW,wF))+20, hgt=when?78:60;
    let lx=sx+14; if(lx+w>this.w-6) lx=sx-14-w; const ly=Math.max(6,Math.min(this.h-hgt-6,sy-hgt/2));
    x.save(); x.globalAlpha=al; x.fillStyle=P.labBg; x.strokeStyle=P.labLine; x.lineWidth=1;
    x.beginPath(); x.roundRect(lx,ly,w,hgt,9); x.fill(); x.stroke();
    x.textBaseline='alphabetic'; x.fillStyle=P.labFg; x.font='600 12px '+SANS; x.fillText(h.name,lx+10,ly+17);
    x.font='500 11px '+SANS; x.fillStyle=open?P.up:P.mut; x.fillText(stat,lx+w-10-wS,ly+17);
    x.fillStyle=P.labFg; x.font='600 15px '+SANS; x.fillText(main,lx+10,ly+38);
    let yy=ly+38;
    if(when){ yy+=17; x.fillStyle=open?P.up:P.labFg; x.font='500 11.5px '+SANS; x.fillText(when,lx+10,yy); }
    x.fillStyle=P.mut; x.font='400 10.5px '+SANS; x.fillText(foot,lx+10,yy+16);
    x.restore();
  }
  frame(t){
    const x=this.x, d=this.d, R=this.R*this.scale, P=window.__pal();
    // motion
    if(this.ty!=null){ let df=((this.ty-this.yaw+Math.PI*3)%(Math.PI*2))-Math.PI; this.yaw+=df*.07; this.pitch+=(this.tp-this.pitch)*.07; if(Math.abs(df)<.002) this.ty=null; }
    else if(!this.drag){ this.yaw+=this.vel; this.vel*=.95; if(this.idle>0) this.idle--; else if(!this.reduce && this.o.auto) this.yaw+=this.o.auto; }
    x.setTransform(d,0,0,d,0,0); x.clearRect(0,0,this.w,this.h);
    const sun=sunPos(t), ss=Math.sin(sun.lat), cs=Math.cos(sun.lat);
    const cp=Math.cos(this.pitch), sp=Math.sin(this.pitch), px=Math.max(1,R/300);
    // faint limb disc
    const g=x.createRadialGradient(this.cx,this.cy,R*.2,this.cx,this.cy,R*1.02);
    g.addColorStop(0,'rgba(15,23,42,0)'); g.addColorStop(.85,P.limb1); g.addColorStop(1,P.limb2);
    x.fillStyle=g; x.beginPath(); x.arc(this.cx,this.cy,R*1.02,0,7); x.fill();
    const draw=(arr,land)=>{
      for(let i=0;i<arr.length;i++){
        const p=arr[i], dl=p.lon-this.yaw, cd=Math.cos(dl);
        const z=sp*p.sl+cp*p.cl*cd; if(z<=0) continue;
        const sx=this.cx+R*p.cl*Math.sin(dl), sy=this.cy-R*(cp*p.sl-sp*p.cl*cd);
        const lt=p.sl*ss+p.cl*cs*Math.cos(p.lon-sun.lon);
        const k=Math.max(0,Math.min(1,(lt+.08)/.2)), zz=Math.pow(z,.55);
        if(land){
          const r=P.n[0]+k*(P.l[0]-P.n[0])|0, gc=P.n[1]+k*(P.l[1]-P.n[1])|0, b=P.n[2]+k*(P.l[2]-P.n[2])|0;
          x.fillStyle=`rgba(${r},${gc},${b},${(.4+.6*zz)*(.78+.22*k)})`;
          const s=(1.2+z*1.2)*px; x.fillRect(sx-s/2,sy-s/2,s,s);
        }else{
          x.fillStyle=`rgba(${P.s},${.06+.10*k*zz})`; const s=px*.9; x.fillRect(sx,sy,s,s);
        }
      }
    };
    draw(sea,false); draw(landPts,true);
    if(this.o.layers) this.o.layers.draw(this,t,R,P);
    // markers
    if(this.o.markers){
      for(const h of HUBS){
        const p=this.project(h.lat*RAD,h.lon*RAD); if(p.z<.02) continue;
        const sx=this.cx+p.x*R, sy=this.cy-p.y*R, open=isOpen(h,t), a=Math.min(1,p.z*2.2);
        const pulse=(Math.sin(t/420+h.lon)+1)/2, act=this.active===h.id, hov=this.hover&&this.hover.id===h.id;
        if(open){ x.strokeStyle=`rgba(16,185,129,${.55*(1-pulse)*a})`; x.lineWidth=1.5; x.beginPath(); x.arc(sx,sy,5+pulse*10,0,7); x.stroke(); }
        if(act||hov){ x.strokeStyle=`rgba(56,189,248,${a})`; x.lineWidth=1.5; x.beginPath(); x.arc(sx,sy,9,0,7); x.stroke(); }
        x.fillStyle = open?`rgba(16,185,129,${a})`:`rgba(148,163,184,${a*.9})`;
        x.beginPath(); x.arc(sx,sy,3.4,0,7); x.fill();
        if(act||hov){
          if(!(h.key&&hov)){
          x.font='500 12px "Hanken Grotesk",sans-serif'; const w=x.measureText(h.name).width+14;
          x.fillStyle=P.labBg; x.strokeStyle=P.labLine; x.lineWidth=1;
          const lx=sx+14, ly=sy-11; x.beginPath(); x.roundRect(lx,ly,w,22,7); x.fill(); x.stroke();
          x.fillStyle=P.labFg; x.fillText(h.name,lx+7,ly+15); }
        }
      }
      // hover card (key exchanges only): fades in on hover, out on leave
      const kh=this.hover&&this.hover.key?this.hover:null;
      if(kh) this.ch=kh;
      this.ca=(this.ca||0)+((kh?1:0)-(this.ca||0))*(this.reduce?1:.22);
      if(this.ch&&this.ca>.03){
        const p=this.project(this.ch.lat*RAD,this.ch.lon*RAD);
        if(p.z>.02) this.card(this.ch,this.cx+p.x*R,this.cy-p.y*R,t,P,this.ca);
      }
    }
    if(this.o.layers) this.o.layers.label(this,x,P);
  }
}


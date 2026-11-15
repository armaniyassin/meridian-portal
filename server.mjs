// Meridian dev server: serves dist/index.html and a same-origin, cached proxy for the three globe-layer feeds.
// Why: OpenSky and TeleGeography send no CORS headers, so browsers cannot call them directly (Golden rules: external
// calls go through the server and are cached). Zero dependencies. Run:  node server.mjs   then open http://localhost:3100
// Same contract as the future Next.js route handlers / Supabase cache: GET /api/satellites | /api/cables | /api/aircraft
import http from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));
const PORT = +process.env.PORT || 3100;
const FEEDS = {
  satellites: { url: process.env.SAT_URL || 'https://celestrak.org/NORAD/elements/gp.php?GROUP=visual&FORMAT=json', ttl: 2 * 3600e3 },   // CelesTrak updates every 2 h
  cables:     { url: process.env.CAB_URL || 'https://www.submarinecablemap.com/api/v3/cable/cable-geo.json',        ttl: 24 * 3600e3 },  // changes rarely
  aircraft:   { url: process.env.AIR_URL || 'https://opensky-network.org/api/states/all',                            ttl: (+process.env.AIR_TTL_S || 900) * 1e3 } // anonymous OpenSky = 400 credits/day, global call = 4 -> one call per ~15 min
};
const cacheDir = path.join(root, '.cache');
const mem = {};          // name -> { t, body }
const inflight = {};     // name -> Promise (one upstream call per feed at a time)

async function readDisk(name) {
  try { const j = JSON.parse(await readFile(path.join(cacheDir, name + '.json'), 'utf8')); return j; } catch { return null; }
}
async function refresh(name) {
  const f = FEEDS[name];
  const r = await fetch(f.url, { headers: { 'User-Agent': 'MeridianDev/1.0 (+local)', Accept: 'application/json' }, signal: AbortSignal.timeout(30000) });
  if (!r.ok) throw new Error('upstream HTTP ' + r.status);
  const body = await r.text();
  JSON.parse(body);                                   // never cache something that is not JSON
  mem[name] = { t: Date.now(), body };
  mkdir(cacheDir, { recursive: true }).then(() => writeFile(path.join(cacheDir, name + '.json'), JSON.stringify(mem[name]))).catch(() => {});
  return mem[name];
}
async function feed(name) {
  const f = FEEDS[name];
  let c = mem[name] || (mem[name] = await readDisk(name)) || null;
  if (c && Date.now() - c.t < f.ttl) return { ...c, stale: false };
  try {
    c = await (inflight[name] ||= refresh(name).finally(() => { delete inflight[name]; }));
    return { ...c, stale: false };
  } catch (e) {
    console.warn(`[${name}] ${e.message}${c ? ' (serving last real snapshot)' : ''}`);
    if (c) return { ...c, stale: true };               // last real data, flagged; never invented
    throw e;
  }
}

http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x');
  try {
    if (u.pathname === '/' || u.pathname === '/index.html') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' });
      return res.end(await readFile(path.join(root, 'dist', 'index.html')));
    }
    const m = u.pathname.match(/^\/api\/(satellites|cables|aircraft)$/);
    if (m) {
      try {
        const c = await feed(m[1]);
        res.writeHead(200, { 'Content-Type': 'application/json', 'X-Fetched-At': String(c.t), 'X-Stale': c.stale ? '1' : '0', 'Cache-Control': 'no-store' });
        return res.end(c.body);
      } catch (e) {
        res.writeHead(503, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'feed unavailable', detail: e.message }));
      }
    }
    res.writeHead(404); res.end('Not found');
  } catch (e) { res.writeHead(500); res.end('Server error'); }
}).listen(PORT, () => {
  console.log(`Meridian dev server running: open http://localhost:${PORT}  (Ctrl+C to stop)`);
  console.log('Checking the three live feeds (can take up to 30 s each)...');
  for (const n of Object.keys(FEEDS)) feed(n).then(c => console.log(`  [${n}] OK${c.stale ? ' (stale snapshot)' : ''}, ${(c.body.length / 1024).toFixed(0)} KB`), e => console.log(`  [${n}] FAILED: ${e.message}${e.cause ? ' / ' + (e.cause.code || e.cause.message) : ''}`));
}).on('error', e => console.log(e.code === 'EADDRINUSE' ? `Port ${PORT} is already in use. Close the other window running this server, or run: $env:PORT=3200; node server.mjs` : e.message));


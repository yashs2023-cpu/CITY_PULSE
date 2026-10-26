// CityPulse backend (Node 18+). Serves the dashboard and proxies TomTom so the key stays private.
const http = require('http'), fs = require('fs'), path = require('path');
try { for (const l of fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split(/\r?\n/)) {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/); if (m && !l.trim().startsWith('#') && !(m[1] in process.env)) process.env[m[1]] = m[2]; } } catch {}
const PORT = +process.env.PORT || 3000, KEY = process.env.TOMTOM_API_KEY || '';
const TTL = (+process.env.TRAFFIC_CACHE_SECONDS || 120) * 1000;
const LOG = path.join(__dirname, 'logs', 'fetch-log.jsonl');
const logLine = (o) => { try { fs.mkdirSync(path.dirname(LOG), { recursive: true }); fs.appendFileSync(LOG, JSON.stringify({ at: new Date().toISOString(), ...o }) + '\n'); } catch {} };
const cfg = () => JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
const MIME = { '.html': 'text/html; charset=utf-8', '.json': 'application/json', '.md': 'text/markdown', '.js': 'text/javascript' };
const FLOW = 'https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json';
const INC = 'https://api.tomtom.com/traffic/services/5/incidentDetails';
const INC_FIELDS = '{incidents{type,geometry{type,coordinates},properties{id,iconCategory,magnitudeOfDelay,events{description,code,iconCategory},startTime,endTime,from,to,length,delay,roadNumbers,timeValidity,lastReportTime}}}';

async function getJson(url, ms = 10000) {
  const ac = new AbortController(), t = setTimeout(() => ac.abort(), ms);
  try { const r = await fetch(url, { signal: ac.signal });
    if (!r.ok) throw new Error('HTTP ' + r.status + (r.status === 429 ? ' (rate limited)' : ''));
    return await r.json(); } finally { clearTimeout(t); }
}
function parseFlow(c, j) {
  const f = j && j.flowSegmentData; if (!f) throw new Error('no flowSegmentData');
  const n = (v) => (typeof v === 'number' && isFinite(v) ? v : null);
  const pts = f.coordinates && f.coordinates.coordinate;
  const matchedPoint = Array.isArray(pts) ? pts.filter((p) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude))
    .reduce((best, p) => {
      const distance = (q) => Math.hypot(q.latitude - c.lat, (q.longitude - c.lon) * Math.cos(c.lat * Math.PI / 180));
      return !best || distance(p) < distance(best) ? p : best;
    }, null) : null;
  return { name: c.name, ok: true, requested: { lat: c.lat, lon: c.lon },
    matched: matchedPoint ? { lat: matchedPoint.latitude, lon: matchedPoint.longitude } : null,
    currentSpeed: n(f.currentSpeed), freeFlowSpeed: n(f.freeFlowSpeed),
    currentTravelTime: n(f.currentTravelTime), freeFlowTravelTime: n(f.freeFlowTravelTime),
    confidence: n(f.confidence), roadClosure: !!f.roadClosure, frc: f.frc || null };
}
function parseIncidents(j) {
  if (!j || !Array.isArray(j.incidents)) throw new Error('no incidents array');
  return j.incidents.map((i) => { const p = i.properties || {}, e = (p.events || [])[0] || {}, g = i.geometry || {};
    let c = g.coordinates; while (Array.isArray(c) && Array.isArray(c[0])) c = c[0];
    return { id: p.id || null, category: p.iconCategory, magnitudeOfDelay: p.magnitudeOfDelay, description: e.description || null,
      from: p.from || null, to: p.to || null, roads: p.roadNumbers || [], delaySec: p.delay ?? null, lengthM: p.length ?? null,
      startTime: p.startTime || null, endTime: p.endTime || null, lastReportTime: p.lastReportTime || null, timeValidity: p.timeValidity || null,
      lon: c && c.length >= 2 ? c[0] : null, lat: c && c.length >= 2 ? c[1] : null }; });
}
let cache = null;
async function traffic() {
  if (cache && Date.now() - cache.at < TTL) return cache.data;
  const C = cfg(), r = C.city.bboxRadiusDeg;
  const bbox = [C.city.longitude - r, C.city.latitude - r, C.city.longitude + r, C.city.latitude + r].map((x) => x.toFixed(5)).join(',');
  const flows = Promise.all(C.corridors.map((c) =>
    getJson(`${FLOW}?point=${c.lat},${c.lon}&unit=KMPH&key=${KEY}`).then((j) => parseFlow(c, j)).catch((e) => ({ name: c.name, ok: false, error: String(e.message).replace(KEY, '***') }))));
  const inc = getJson(`${INC}?key=${KEY}&bbox=${bbox}&fields=${encodeURIComponent(INC_FIELDS)}&language=en-GB&timeValidityFilter=present`)
    .then((j) => ({ ok: true, items: parseIncidents(j) })).catch((e) => ({ ok: false, items: [], error: String(e.message).replace(KEY, '***') }));
  const [corridors, incidents] = await Promise.all([flows, inc]);
  const data = { provider: 'TomTom Traffic API', fetchedAt: Date.now(), bbox, corridors, incidents,
    attribution: 'Traffic data © TomTom', note: 'Flow responses carry no observation timestamp; fetchedAt is the earliest bound.' };
  if (!corridors.some((c) => c.ok) && !incidents.ok) throw new Error('all TomTom requests failed: ' + (corridors[0].error || incidents.error));
  logLine({ source: 'traffic', origin: 'server', ok: true, corridorsOk: corridors.filter((c) => c.ok).length, corridorsTotal: corridors.length, incidentsOk: incidents.ok });
  cache = { at: Date.now(), data }; return data;
}
const send = (res, code, body, type = 'application/json') => {
  if (code === 204) { res.writeHead(204, { 'Access-Control-Allow-Origin': '*' }); return res.end(); }
  res.writeHead(code, { 'Content-Type': type, 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Cache-Control': 'no-store' });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body)); };
const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x');
  if (req.method === 'OPTIONS') { res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST', 'Access-Control-Allow-Headers': 'Content-Type' }); return res.end(); }
  try {
    if (u.pathname === '/api/config') return send(res, 200, cfg());
    if (u.pathname === '/api/health') return send(res, 200, { ok: true, tomtomKeyConfigured: !!KEY });
    if (u.pathname === '/api/traffic') {
      if (!KEY) return send(res, 503, { error: 'TOMTOM_API_KEY is not configured on the server (see .env.example)' });
      try { return send(res, 200, await traffic()); } catch (e) { logLine({ source: 'traffic', origin: 'server', ok: false, error: e.message }); return send(res, 502, { error: e.message }); }
    }
    if (u.pathname === '/api/log' && req.method === 'POST') { // dashboard reports each provider fetch outcome (for uptime + T3 simulator validation)
      let d = ''; for await (const ch of req) { d += ch; if (d.length > 4000) return send(res, 413, { error: 'too large' }); }
      const b = JSON.parse(d || '{}'); if (!['weather', 'airQuality', 'traffic', 'notices'].includes(b.source)) return send(res, 400, { error: 'bad source' });
      // Core uptime fields (existing – log-summary.js depends on these)
      const line = {
        source: b.source, origin: 'dashboard', ok: !!b.ok,
        ms: Number.isFinite(b.ms) ? Math.round(b.ms) : null,
        error: b.error ? String(b.error).slice(0, 200) : null
      };
      // Extended metric fields (L4 – T3 evaluate-simulator.js uses predicted vs actual)
      // Accept an array of readings or a single reading under "readings" / "reading"
      const readings = Array.isArray(b.readings) ? b.readings : (b.reading ? [b.reading] : []);
      if (readings.length) {
        line.readings = readings.map(r => ({
          metric:     typeof r.metric   === 'string'  ? r.metric.slice(0, 80)   : null,
          value:      Number.isFinite(r.value)        ? r.value                 : null,
          unit:       typeof r.unit     === 'string'  ? r.unit.slice(0, 40)     : null,
          location:   typeof r.location === 'string'  ? r.location.slice(0, 80) : null,
          observedAt: Number.isFinite(r.observedAt)   ? r.observedAt            : null,
          dataType:   typeof r.dataType === 'string'  ? r.dataType.slice(0, 40) : null,
          status:     typeof r.status   === 'string'  ? r.status.slice(0, 40)   : null
        }));
      }
      logLine(line); return send(res, 204, '');
    }
    const f = u.pathname === '/' ? 'project_citypulse.html' : path.basename(u.pathname);
    const ok = ['project_citypulse.html', 'README.md', 'DATA_SOURCES.md'].includes(f);
    if (!ok) return send(res, 404, 'Not found', 'text/plain');
    send(res, 200, fs.readFileSync(path.join(__dirname, f)), MIME[path.extname(f)] || 'text/plain');
  } catch (e) { send(res, 500, { error: e.message }); }
});
// ── Server-side poller ──────────────────────────────────────────────────────
// Keeps logs/fetch-log.jsonl growing even when no browser tab is open.
// Runs the full traffic() call (Flow + Incidents) on the configured interval
// and logs a line with source:"traffic", origin:"server-poller".
// Weather and air-quality are browser-direct (no key) – they are not polled
// here to avoid redundant model-estimate calls; only traffic needs a server key.
const POLL_MS = TTL; // match the cache TTL so each poll gets a fresh response
let pollerTimer = null;
function startPoller() {
  if (!KEY) { logLine({ source: 'server-poller', origin: 'server', ok: false, error: 'TOMTOM_API_KEY not set – poller idle' }); return; }
  const run = async () => {
    try {
      // Force cache bypass by clearing it before the poll call
      cache = null;
      const data = await traffic();
      logLine({ source: 'traffic', origin: 'server-poller', ok: true,
        corridorsOk: data.corridors.filter(c => c.ok).length,
        corridorsTotal: data.corridors.length,
        incidentsOk: data.incidents.ok,
        fetchedAt: data.fetchedAt });
    } catch (e) {
      logLine({ source: 'traffic', origin: 'server-poller', ok: false, error: e.message });
    }
    pollerTimer = setTimeout(run, POLL_MS);
  };
  // First run after one interval (dashboard may also call on startup)
  pollerTimer = setTimeout(run, POLL_MS);
  console.log(`Server-side traffic poller started (every ${POLL_MS / 1000}s)`);
}

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`CityPulse on http://localhost:${PORT}  (TomTom key ${KEY ? 'configured' : 'NOT configured – traffic/infrastructure will show Unavailable'})`);
    startPoller();
  });
}
module.exports = { parseFlow, parseIncidents, startPoller };

/* CITY-PULSE T2 system-quality collector. */
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const LOG_DIR = path.join(ROOT, 'logs');
const OUT = path.join(ROOT, 'docs', 'evidence');

function readJsonLines(file) {
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, 'utf8').split(/\r?\n/).filter(Boolean).flatMap(line => {
    try { return [JSON.parse(line)]; } catch { return []; }
  });
}

function pick(o, keys) {
  for (const k of keys) if (o && o[k] !== undefined && o[k] !== null) return o[k];
  return undefined;
}

function percentile(values, p) {
  if (!values.length) return null;
  const a = [...values].sort((x, y) => x - y);
  const i = (a.length - 1) * p;
  const lo = Math.floor(i), hi = Math.ceil(i);
  return lo === hi ? a[lo] : a[lo] + (a[hi] - a[lo]) * (i - lo);
}

const files = fs.existsSync(LOG_DIR) ? fs.readdirSync(LOG_DIR).filter(f => f.endsWith('.jsonl')) : [];
const records = files.flatMap(f => readJsonLines(path.join(LOG_DIR, f)));
const byProvider = new Map();
const stateCounts = { live: 0, stale: 0, unavailable: 0, other: 0 };

for (const r of records) {
  const provider = pick(r, ['provider', 'source', 'service', 'name']) || 'unknown';
  const status = String(pick(r, ['status', 'state', 'result']) ?? '').toLowerCase();
  const ok = status === 'ok' || status === 'success' || status === '200' || r.success === true || r.ok === true;
  const latency = Number(pick(r, ['latencyMs', 'durationMs', 'latency', 'responseTimeMs']));
  if (!byProvider.has(provider)) byProvider.set(provider, { fetches: 0, successes: 0, failures: 0, latencies: [] });
  const x = byProvider.get(provider);
  x.fetches++;
  if (ok) x.successes++; else x.failures++;
  if (Number.isFinite(latency) && latency >= 0) x.latencies.push(latency);

  const readingState = String(pick(r, ['readingStatus', 'dataStatus', 'freshness', 'reading_state', 'state']) ?? '').toLowerCase();
  if (readingState.includes('live') || readingState.includes('fresh')) stateCounts.live++;
  else if (readingState.includes('stale')) stateCounts.stale++;
  else if (readingState.includes('unavailable') || readingState.includes('missing')) stateCounts.unavailable++;
}

const providers = Object.fromEntries([...byProvider.entries()].map(([name, x]) => [name, {
  fetches: x.fetches,
  successes: x.successes,
  failures: x.failures,
  successRate: x.fetches ? Number((100 * x.successes / x.fetches).toFixed(2)) : null,
  p50Ms: percentile(x.latencies, 0.5),
  p95Ms: percentile(x.latencies, 0.95)
}]));

const totalStates = stateCounts.live + stateCounts.stale + stateCounts.unavailable;
const readingStates = {
  counts: stateCounts,
  percentages: totalStates ? {
    live: Number((100 * stateCounts.live / totalStates).toFixed(2)),
    stale: Number((100 * stateCounts.stale / totalStates).toFixed(2)),
    unavailable: Number((100 * stateCounts.unavailable / totalStates).toFixed(2))
  } : null,
  note: totalStates ? 'Derived from recognised reading-state records.' : 'No recognised reading-state records found; do not infer from provider request success.'
};

const authorityCandidates = files.filter(f => /author|workflow|audit/i.test(f));
const result = {
  generatedAt: new Date().toISOString(),
  logFiles: files,
  providerQuality: providers,
  readingStates,
  authorityWorkflow: {
    status: 'pending-source-run',
    filesInspected: authorityCandidates,
    note: 'Approval rate and time-to-approve must come from the Authority workflow-metrics endpoint or audit records; they are not inferred from fetch logs.'
  }
};

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'system-quality.json'), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));

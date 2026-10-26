#!/usr/bin/env node
// D1 — Log analysis for T1/T2/T3.
// Reads logs/fetch-log.jsonl and prints a structured markdown table
// suitable for docs/metrics-report.md (T2) and evaluate-simulator.js (T3).
//
// Usage:
//   node scripts/log-analysis.js [logfile]          — full analysis
//   node scripts/log-analysis.js [logfile] --json   — machine-readable JSON for T3
//
// Owner: T1 (runs it), T2 (paste table into metrics-report.md), T3 (--json flag)

'use strict';
const fs = require('fs'), path = require('path');
const file = process.argv.find((a, i) => i > 1 && !a.startsWith('--'))
  || path.join(__dirname, '..', 'logs', 'fetch-log.jsonl');
const jsonOut = process.argv.includes('--json');

if (!fs.existsSync(file)) {
  console.error(`No log file found: ${file}`);
  console.error('Run the dashboard with the backend running for at least a few minutes, then retry.');
  process.exit(1);
}

const rows = fs.readFileSync(file, 'utf8')
  .split('\n').filter(Boolean)
  .map(l => { try { return JSON.parse(l); } catch { return null; } })
  .filter(Boolean);

if (!rows.length) { console.error('Log file is empty.'); process.exit(1); }

// ── Per-source stats ─────────────────────────────────────────────────────────
const bySource = {};
for (const r of rows) {
  const key = r.source || 'unknown';
  (bySource[key] = bySource[key] || []).push(r);
}

const pct = (arr, p) => {
  const s = arr.slice().sort((a, b) => a - b);
  return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : null;
};
const fmt1 = v => v == null ? '—' : String(v);
const fmtPct = v => v == null ? '—' : v.toFixed(1) + '%';
const fmtMs  = v => v == null ? '—' : v + ' ms';

const stats = {};
for (const [src, entries] of Object.entries(bySource)) {
  const total   = entries.length;
  const okCount = entries.filter(r => r.ok).length;
  const msTimes = entries.filter(r => r.ok && r.ms != null).map(r => r.ms);
  const times   = entries.map(r => r.at).sort();
  const errMap  = {};
  entries.filter(r => !r.ok && r.error)
    .forEach(r => { errMap[r.error] = (errMap[r.error] || 0) + 1; });
  const topErrors = Object.entries(errMap).sort((a, b) => b[1] - a[1]).slice(0, 3);

  stats[src] = {
    source: src,
    total,
    okCount,
    successRate: total ? (okCount / total) * 100 : 0,
    p50: pct(msTimes, 0.5),
    p95: pct(msTimes, 0.95),
    first: times[0] || null,
    last:  times[times.length - 1] || null,
    topErrors
  };
}

// ── Gap detection ─────────────────────────────────────────────────────────────
// A gap is a span > 3× the expected refresh interval with no ok entry
const INTERVALS = { weather: 600, airQuality: 900, traffic: 300, notices: 60 };
function detectGaps(entries, intervalSec) {
  const okTimes = entries.filter(r => r.ok && r.at)
    .map(r => new Date(r.at).getTime()).sort((a, b) => a - b);
  if (okTimes.length < 2) return [];
  const threshold = intervalSec * 3 * 1000;
  const gaps = [];
  for (let i = 1; i < okTimes.length; i++) {
    const gapMs = okTimes[i] - okTimes[i - 1];
    if (gapMs > threshold) {
      gaps.push({ from: new Date(okTimes[i - 1]).toISOString(), to: new Date(okTimes[i]).toISOString(), durationMin: Math.round(gapMs / 60000) });
    }
  }
  return gaps;
}

// ── Metric value extraction (L4 — T3 simulator validation) ───────────────────
// Pulls predicted-vs-actual pairs from log lines that carry readings[]
function extractMetricReadings() {
  const out = {};
  for (const r of rows) {
    if (!Array.isArray(r.readings)) continue;
    for (const rd of r.readings) {
      if (!rd.metric || rd.value == null) continue;
      (out[rd.metric] = out[rd.metric] || []).push({
        at: r.at, value: rd.value, unit: rd.unit, location: rd.location,
        dataType: rd.dataType, source: r.source
      });
    }
  }
  return out;
}

// ── Output ────────────────────────────────────────────────────────────────────
if (jsonOut) {
  const metricReadings = extractMetricReadings();
  console.log(JSON.stringify({ generatedAt: new Date().toISOString(), sampleSize: rows.length, stats, metricReadings }, null, 2));
  process.exit(0);
}

// Human-readable markdown
const now = new Date().toISOString();
console.log(`# CityPulse — Log Analysis`);
console.log(`Generated: ${now}  |  Log file: ${file}  |  Total lines: ${rows.length}\n`);

// Warn about small samples
if (rows.length < 50) {
  console.warn(`⚠ WARNING: Only ${rows.length} log lines. Statistics below have low reliability.`);
  console.warn(`   Collect at least a few hours of data before drawing conclusions.\n`);
}

console.log('## Per-source summary\n');
console.log('| Source | Fetches (n) | Success % | p50 latency | p95 latency | First log | Last log |');
console.log('|---|---|---|---|---|---|---|');
for (const s of Object.values(stats)) {
  console.log(`| ${s.source} | ${s.total} | ${fmtPct(s.successRate)} | ${fmtMs(s.p50)} | ${fmtMs(s.p95)} | ${s.first || '—'} | ${s.last || '—'} |`);
}

console.log('\n## Top failure causes\n');
for (const s of Object.values(stats)) {
  if (!s.topErrors.length) continue;
  console.log(`**${s.source}**`);
  s.topErrors.forEach(([err, cnt]) => console.log(`  - (${cnt}×) ${err}`));
}

console.log('\n## Data gaps (> 3× refresh interval with no successful fetch)\n');
let anyGaps = false;
for (const [src, entries] of Object.entries(bySource)) {
  const gaps = detectGaps(entries, INTERVALS[src] || 600);
  if (gaps.length) {
    anyGaps = true;
    console.log(`**${src}** — ${gaps.length} gap(s):`);
    gaps.forEach(g => console.log(`  - ${g.from} → ${g.to}  (${g.durationMin} min)`));
  }
}
if (!anyGaps) console.log('No gaps detected.');

console.log('\n## Metric readings logged (L4 extended fields)\n');
const metricReadings = extractMetricReadings();
const metricKeys = Object.keys(metricReadings);
if (!metricKeys.length) {
  console.log('No extended metric readings found. Upgrade the dashboard to send `readings[]` in `/api/log` calls (L4).');
} else {
  console.log('| Metric | Count | Latest value | Unit | Source |');
  console.log('|---|---|---|---|---|');
  for (const [m, readings] of Object.entries(metricReadings)) {
    const latest = readings[readings.length - 1];
    console.log(`| ${m} | ${readings.length} | ${latest.value} | ${latest.unit || '—'} | ${latest.source} |`);
  }
}

console.log('\n---');
console.log('> Sample size is shown next to every number above.');
console.log('> Statistics with n < 20 are not reliable — label them accordingly in the metrics report.');
console.log('> Run `node scripts/log-analysis.js --json > logs/analysis.json` to produce a machine-readable file for T3.');

#!/usr/bin/env node
'use strict';

// T3-owned analytics for JSONL logs. Uses only logged observations; never fabricates values.
const fs = require('fs');
const path = require('path');

function parseTime(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    // Accept epoch seconds or milliseconds.
    return value < 1e12 ? value * 1000 : value;
  }
  if (typeof value === 'string' && value.trim()) {
    const n = Date.parse(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function readLog(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const rows = [];
  for (const [i, line] of fs.readFileSync(filePath, 'utf8').split(/\r?\n/).entries()) {
    if (!line.trim()) continue;
    try {
      const parsed = JSON.parse(line);
      if (parsed && typeof parsed === 'object') rows.push(parsed);
    } catch (e) {
      console.warn(`Skipping invalid JSON on line ${i + 1}`);
    }
  }
  return rows;
}

function extractObservations(rows) {
  const out = [];
  for (const row of rows) {
    const readings = Array.isArray(row.readings) ? row.readings : (row.reading ? [row.reading] : []);
    for (const r of readings) {
      if (!r || typeof r.metric !== 'string' || !Number.isFinite(Number(r.value))) continue;
      const time = parseTime(r.observedAt ?? r.fetchedAt ?? row.at ?? row.timestamp);
      if (time == null) continue;
      const metric = r.metric.trim().toLowerCase();
      const location = String(r.location || r.zone || r.scope || 'unspecified').trim();
      const dataType = String(r.dataType || '').trim().toLowerCase();
      out.push({ metric, value: Number(r.value), time, location, dataType, unit: r.unit || null, source: r.source || row.source || null });
    }
  }
  return out.sort((a, b) => a.time - b.time);
}

function metricMatches(metric, kind) {
  if (kind === 'rain') return /rain|precip|precipitation|rainfall/.test(metric);
  if (kind === 'congestion') return /congestion|traffic/.test(metric);
  return false;
}

function intervalChanges(observations, metric, intervalHours = 24) {
  const chosen = observations.filter(o => metricMatches(o.metric, metric));
  const intervalMs = intervalHours * 3600000;
  const changes = [];
  for (let i = 0; i < chosen.length; i++) {
    const start = chosen[i];
    const later = chosen.slice(i + 1).find(o => o.location === start.location && o.time > start.time && o.time - start.time >= intervalMs);
    if (later) {
      changes.push({
        metric: start.metric, location: start.location,
        from: new Date(start.time).toISOString(), to: new Date(later.time).toISOString(),
        elapsedHours: (later.time - start.time) / 3600000,
        startValue: start.value, endValue: later.value, change: later.value - start.value
      });
    }
  }
  return changes;
}

function pearson(xs, ys) {
  const n = Math.min(xs.length, ys.length);
  if (n < 2) return null;
  const x = xs.slice(0, n), y = ys.slice(0, n);
  const mx = x.reduce((a,b)=>a+b,0)/n, my = y.reduce((a,b)=>a+b,0)/n;
  const dx = x.map(v=>v-mx), dy = y.map(v=>v-my);
  const denom = Math.sqrt(dx.reduce((s,v)=>s+v*v,0) * dy.reduce((s,v)=>s+v*v,0));
  return denom === 0 ? null : dx.reduce((s,v,i)=>s+v*dy[i],0)/denom;
}

function rainCongestionCorrelation(observations, windowMinutes = 60) {
  const rain = observations.filter(o => metricMatches(o.metric, 'rain'));
  const congestion = observations.filter(o => metricMatches(o.metric, 'congestion'));
  const maxGap = windowMinutes * 60000;
  const pairs = [];
  for (const c of congestion) {
    const candidates = rain.filter(r => r.location === c.location && Math.abs(r.time - c.time) <= maxGap)
      .sort((a,b)=>Math.abs(a.time-c.time)-Math.abs(b.time-c.time));
    if (candidates.length) {
      const r = candidates[0];
      pairs.push({ location: c.location, time: new Date(c.time).toISOString(), rain: r.value, congestion: c.value, gapMinutes: Math.abs(r.time-c.time)/60000 });
    }
  }
  const coefficient = pearson(pairs.map(p=>p.rain), pairs.map(p=>p.congestion));
  return { n: pairs.length, windowMinutes, pearsonR: coefficient, pairs };
}

function analyze(filePath, intervalHours = 24, windowMinutes = 60) {
  const rows = readLog(filePath);
  const observations = extractObservations(rows);
  return {
    filePath, logRows: rows.length, observationCount: observations.length,
    intervalHours,
    congestionChanges: intervalChanges(observations, 'congestion', intervalHours),
    rainChanges: intervalChanges(observations, 'rain', intervalHours),
    rainCongestionCorrelation: rainCongestionCorrelation(observations, windowMinutes),
    limitations: [
      'Only logged metric readings with usable timestamps are analyzed.',
      'Rain/congestion correlation is descriptive, not causal.',
      'The nearest rain and congestion readings are paired only within the configured time window and same location label.',
      'No values or missing observations are imputed.'
    ]
  };
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const json = args.includes('--json');
  const positional = args.filter(a => !a.startsWith('--'));
  const file = path.resolve(positional[0] || 'logs/fetch-log.jsonl');
  const intervalArg = args.find(a => a.startsWith('--interval-hours='));
  const windowArg = args.find(a => a.startsWith('--rain-window-minutes='));
  const intervalHours = intervalArg ? Number(intervalArg.split('=')[1]) : 24;
  const windowMinutes = windowArg ? Number(windowArg.split('=')[1]) : 60;
  if (!(intervalHours > 0) || !(windowMinutes >= 0)) {
    console.error('interval hours must be > 0 and rain window minutes must be >= 0');
    process.exitCode = 2;
  } else {
    const result = analyze(file, intervalHours, windowMinutes);
    if (json) console.log(JSON.stringify(result, null, 2));
    else {
      console.log('CityPulse T3 Analytics');
      console.log(`Log file: ${result.filePath}`);
      console.log(`Log rows: ${result.logRows}`);
      console.log(`Usable observations: ${result.observationCount}`);
      console.log(`Congestion changes over >= ${intervalHours} hours: ${result.congestionChanges.length}`);
      console.log(`Rain changes over >= ${intervalHours} hours: ${result.rainChanges.length}`);
      const corr = result.rainCongestionCorrelation;
      console.log(`Rain/congestion paired observations: n=${corr.n}`);
      console.log(`Pearson r: ${corr.pearsonR == null ? 'unavailable (insufficient variation or fewer than 2 pairs)' : corr.pearsonR.toFixed(4)}`);
      if (!result.observationCount) console.log('No usable metric observations found. No analytics values were calculated.');
    }
  }
}

module.exports = { parseTime, readLog, extractObservations, intervalChanges, pearson, rainCongestionCorrelation, analyze };

#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

function readRows(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, 'utf8');
  const rows = [];
  for (const [index, line] of content.split(/\r?\n/).entries()) {
    if (!line.trim()) continue;
    try {
      const row = JSON.parse(line);
      if (row && typeof row === 'object') rows.push(row);
    } catch (err) {
      console.warn(`Skipping invalid JSON on line ${index + 1}: ${err.message}`);
    }
  }
  return rows;
}

function validReading(r) {
  return r &&
    String(r.metric || '').toLowerCase() === 'congestion' &&
    Number.isFinite(Number(r.value)) &&
    Number(r.value) >= 0 && Number(r.value) <= 100 &&
    typeof r.scenario === 'string' && r.scenario.trim() &&
    typeof r.location === 'string' && r.location.trim() &&
    typeof r.pairId === 'string' && r.pairId.trim() &&
    typeof r.observedAt === 'string' && Number.isFinite(Date.parse(r.observedAt)) &&
    ['scenario_prediction', 'observed_outcome'].includes(r.dataType);
}

function extractPairs(rows, maxHorizonHours = 24) {
  const predictions = new Map();
  const outcomes = new Map();
  const maxMs = maxHorizonHours * 60 * 60 * 1000;

  for (const row of rows) {
    const readings = Array.isArray(row.readings) ? row.readings : (row.reading ? [row.reading] : []);
    for (const raw of readings) {
      if (!validReading(raw)) continue;
      const r = {
        ...raw,
        value: Number(raw.value),
        atMs: Date.parse(raw.observedAt),
        scenario: raw.scenario.trim(),
        location: raw.location.trim(),
        pairId: raw.pairId.trim()
      };
      const key = `${r.scenario}\u0000${r.location}\u0000${r.pairId}`;
      const target = r.dataType === 'scenario_prediction' ? predictions : outcomes;
      if (!target.has(key)) target.set(key, []);
      target.get(key).push(r);
    }
  }

  const pairs = [];
  for (const [key, preds] of predictions.entries()) {
    const obs = outcomes.get(key) || [];
    for (const p of preds) {
      const later = obs
        .filter(o => o.atMs > p.atMs && o.atMs - p.atMs <= maxMs)
        .sort((a, b) => a.atMs - b.atMs);
      if (later.length) {
        const o = later[0];
        pairs.push({
          scenario: p.scenario,
          location: p.location,
          pairId: p.pairId,
          predicted: p.value,
          observed: o.value,
          error: p.value - o.value,
          absoluteError: Math.abs(p.value - o.value),
          predictedAt: p.observedAt,
          observedAt: o.observedAt
        });
      }
    }
  }
  return pairs.sort((a, b) => a.predictedAt.localeCompare(b.predictedAt));
}

function summarize(pairs) {
  const groups = new Map();
  for (const p of pairs) {
    if (!groups.has(p.scenario)) groups.set(p.scenario, []);
    groups.get(p.scenario).push(p);
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([scenario, items]) => ({
    scenario,
    n: items.length,
    mae: items.reduce((s, p) => s + p.absoluteError, 0) / items.length,
    bias: items.reduce((s, p) => s + p.error, 0) / items.length
  }));
}

function evaluateFile(filePath, maxHorizonHours = 24) {
  const rows = readRows(filePath);
  const pairs = extractPairs(rows, maxHorizonHours);
  return { filePath, logRows: rows.length, pairCount: pairs.length, summary: summarize(pairs), pairs };
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const jsonMode = args.includes('--json');
  const horizonArg = args.find(a => a.startsWith('--max-horizon-hours='));
  const horizon = horizonArg ? Number(horizonArg.split('=')[1]) : 24;
  const fileArg = args.find(a => !a.startsWith('--'));
  const filePath = path.resolve(fileArg || 'logs/fetch-log.jsonl');

  if (!Number.isFinite(horizon) || horizon <= 0) {
    console.error('Error: --max-horizon-hours must be a positive number.');
    process.exitCode = 2;
  } else {
    const result = evaluateFile(filePath, horizon);
    if (jsonMode) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log('CityPulse Simulator Evaluation');
      console.log(`Log file: ${result.filePath}`);
      console.log(`Log rows: ${result.logRows}`);
      console.log(`Matched prediction/outcome pairs: ${result.pairCount}`);
      if (!result.summary.length) {
        console.log('No valid real prediction/outcome pairs found.');
        console.log('Required: congestion readings with matching scenario, location, pairId; prediction followed by observed outcome within the horizon.');
        console.log('Do not interpret synthetic tests as real-world validation.');
        process.exitCode = 2;
      } else {
        console.log('\nScenario results (congestion percentage points):');
        for (const s of result.summary) {
          console.log(`${s.scenario}: n=${s.n}, MAE=${s.mae.toFixed(2)}, bias=${s.bias.toFixed(2)}`);
        }
      }
    }
  }
}

module.exports = { readRows, extractPairs, summarize, evaluateFile };

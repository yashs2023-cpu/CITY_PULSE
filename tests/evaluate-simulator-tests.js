#!/usr/bin/env node
'use strict';
const assert = require('assert');
const { extractPairs, summarize } = require('../scripts/evaluate-simulator');

const rows = [{
  readings: [
    { metric:'congestion', value:60, scenario:'heavy_rain', location:'Zone A', pairId:'p1', observedAt:'2026-01-01T10:00:00Z', dataType:'scenario_prediction' },
    { metric:'congestion', value:50, scenario:'heavy_rain', location:'Zone A', pairId:'p1', observedAt:'2026-01-01T11:00:00Z', dataType:'observed_outcome' },
    { metric:'congestion', value:40, scenario:'heavy_rain', location:'Zone A', pairId:'p2', observedAt:'2026-01-02T10:00:00Z', dataType:'scenario_prediction' },
    { metric:'congestion', value:45, scenario:'heavy_rain', location:'Zone A', pairId:'p2', observedAt:'2026-01-02T12:00:00Z', dataType:'observed_outcome' }
  ]
}];
const pairs = extractPairs(rows);
assert.strictEqual(pairs.length, 2);
const s = summarize(pairs)[0];
assert.strictEqual(s.n, 2);
assert.strictEqual(s.mae, 7.5);
assert.strictEqual(s.bias, 2.5);

assert.strictEqual(extractPairs([{ readings: [
  { metric:'congestion', value:60, scenario:'x', location:'A', pairId:'x', observedAt:'2026-01-01T10:00:00Z', dataType:'observed_outcome' },
  { metric:'congestion', value:40, scenario:'x', location:'A', pairId:'x', observedAt:'2026-01-01T11:00:00Z', dataType:'scenario_prediction' }
]}]).length, 0);

assert.strictEqual(extractPairs([{ readings: [
  { metric:'congestion', value:40, scenario:'x', location:'A', pairId:'x', observedAt:'2026-01-01T10:00:00Z', dataType:'scenario_prediction' },
  { metric:'congestion', value:50, scenario:'x', location:'A', pairId:'x', observedAt:'2026-01-03T10:00:00Z', dataType:'observed_outcome' }
]}]).length, 0);
console.log('Simulator evaluator tests passed.');

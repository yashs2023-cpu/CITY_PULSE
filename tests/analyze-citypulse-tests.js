#!/usr/bin/env node
'use strict';
const assert = require('assert');
const { parseTime, extractObservations, intervalChanges, rainCongestionCorrelation } = require('../scripts/analyze-citypulse');

assert.strictEqual(parseTime('2026-01-01T00:00:00Z'), Date.parse('2026-01-01T00:00:00Z'));
assert.strictEqual(parseTime(1767225600), 1767225600000);

const rows = [
 { readings: [
   { metric:'precipitation', value:1, location:'Zone A', observedAt:'2026-01-01T00:00:00Z' },
   { metric:'congestion', value:20, location:'Zone A', observedAt:'2026-01-01T00:20:00Z' }
 ]},
 { readings: [
   { metric:'rainfall', value:2, location:'Zone A', observedAt:'2026-01-02T00:00:00Z' },
   { metric:'congestion', value:40, location:'Zone A', observedAt:'2026-01-02T00:30:00Z' }
 ]},
 { readings: [
   { metric:'precipitation', value:3, location:'Zone A', observedAt:'2026-01-03T00:00:00Z' },
   { metric:'congestion', value:60, location:'Zone A', observedAt:'2026-01-03T00:30:00Z' }
 ]}
];
const obs = extractObservations(rows);
assert.strictEqual(obs.length, 6);
assert.strictEqual(intervalChanges(obs, 'congestion', 24).length, 2);
const corr = rainCongestionCorrelation(obs, 60);
assert.strictEqual(corr.n, 3);
assert.ok(Math.abs(corr.pearsonR - 1) < 1e-9);
assert.strictEqual(rainCongestionCorrelation(obs, 1).n, 0);
console.log('CityPulse analytics tests passed.');

# Goal–Question–Metric (GQM) Plan — CityPulse

**Owner:** T2 (Purushottam)  
**Purpose:** Assess whether CityPulse communicates data availability and quality transparently, whether its providers respond reliably, whether readings are sufficiently fresh and complete, and whether the project-defined trust score is interpretable.

## G1 — Data availability and credibility

| Question | Metric | Definition and formula | Unit | Data source | Measurement frequency |
|---|---|---|---|---|---|
| Q1. What proportion of configured sources/readings is live, stale, or unavailable? | Live / stale / unavailable share | For each status: `count(readings with status) / count(all evaluated readings) × 100`. Exclude records with unknown status and report the denominator. | % and count | Current browser data store (`store.r`, `readingStatus()` and `store.src`) | Recompute on each render and after every source update |
| Q2. How reliable are provider requests in the captured sample? | Observed request success rate (uptime proxy) | `successful logged fetches / all logged fetches × 100`. This is a sample success rate, not a guarantee of continuous service availability. | %; requests (n) | `logs/fetch-log.jsonl`; `node scripts/log-summary.js` / `analysis.json` | Each log-analysis run; report the log window and n |

## G2 — Responsiveness and data quality

| Question | Metric | Definition and formula | Unit | Data source | Measurement frequency |
|---|---|---|---|---|---|
| Q3. How long do provider requests take? | p50 and p95 latency | Sort successful requests with numeric `ms`; p50/p95 are the nearest-rank percentiles at 0.50/0.95 (use the implementation's percentile convention consistently). Failed requests and missing durations are excluded; report n. | milliseconds | `logs/fetch-log.jsonl`; `scripts/log-summary.js` or `analysis.json` | Each log-analysis run, grouped by source |
| Q4. How old are displayed readings? | Reading age / freshness | `max(0, now − observedAt)`; compare against configured source interval. The UI classifies a reading as live while source state is successful and last success is less than 3× its refresh interval old; otherwise stale/unavailable per source state. | seconds or minutes; status | Reading `observedAt`, source `lastOk`, `CFG.refreshSeconds`, `readingStatus()` | On render and each source update |
| Q5. Are required reading fields populated? | Completeness score | `present required fields / 8 × 100`; fields: `metric`, `label`, `value`, `unit`, `location`, `source`, `observedAt`, `fetchedAt`. | % per reading | Normalized reading object in `store.r` and `trustScore()` | Whenever a reading is created/updated |
| Q6. What trust score is assigned to a reading? | Trust score | `round(0.40 × F + 0.40 × S + 0.20 × C)`, where F is freshness score (0–100, decays linearly to zero at 3× refresh interval), S is project-defined source-type score (sensor 100, provider 80, authority 60, model 40, derived 20, projection/unavailable 0), and C is completeness (0–100 across 8 fields). | score 0–100 | `trustScore()` in `project_citypulse.html` | Whenever a reading is created/updated; freshness is recalculated from its timestamps |

## G3 — Governance workflow

| Question | Metric | Definition and formula | Unit | Data source | Measurement frequency |
|---|---|---|---|---|---|
| Q7. How quickly are reports approved? | Mean time to approve | Mean of `approvedAt − createdAt` for approved reports with valid non-negative timestamps. Report the number of durations used. | milliseconds (optionally converted to minutes/hours) and n | Authenticated authority endpoint `/api/admin/workflow-metrics` (admin server) | On request; report sample size |
| Q8. What proportion of decided reports are approved? | Approval rate | `approved reports / (approved reports + rejected reports)`. Pending reports are excluded; if no reports have been decided, show “No data yet”. | % and n | `/api/admin/workflow-metrics` | On request; report sample size |

## G4 — Software quality and simulator evaluation

| Question | Metric | Definition and formula | Unit | Data source | Measurement frequency |
|---|---|---|---|---|---|
| Q9. How complex and maintainable is the code? | LOC, per-function cyclomatic complexity, comment ratio, duplication | Use documented static-analysis tools; state tool/version and scope. Do not estimate values manually. | lines, complexity points, %, duplicated lines/blocks | Tool output committed under `docs/evidence/` | Each release candidate or substantial refactor |
| Q10. How thoroughly is code tested? | Statement/branch coverage; defects found/fixed | `covered statements / total statements × 100`; `covered branches / total branches × 100`; count defects by status in defect log. | %, count | Coverage tool output and defect log | After each test-suite change / release candidate |
| Q11. How close are simulator projections to later observations? | MAE and signed bias per scenario | `MAE = mean(|prediction − observed|)`; `bias = mean(prediction − observed)`. Require valid matched pairs; report n and horizon. | congestion percentage points and n | `scripts/evaluate-simulator.js` using prediction/outcome log pairs | Whenever enough new matched observations are collected |

## Interpretation and limitations

- “Observed request success rate” is used instead of claiming continuous uptime when logs only capture individual fetch attempts.
- Latency percentiles must include the source, time window, and sample size. They describe successful logged requests only.
- Browser-direct weather and air-quality requests are logged only while a browser tab is active; the resulting sample is not a 24/7 service-level measurement.
- Freshness and trust weights are project-defined operational rules, not independently calibrated standards.
- Missing values must be rendered as **“No data yet”**, not as zero. A real measured zero remains valid when supported by the source.
- Every reported result must be reproducible from a tool run or source log committed under `docs/evidence/`.

# CITY-PULSE T2 — Goal–Question–Metric (GQM) Plan

## 1. Goal

Analyze the CITY-PULSE system for the purpose of evaluating and improving **software quality, system reliability, maintainability, performance, and data quality** from the viewpoint of the development and QA team, with specific focus on the T2 System Quality area.

## 2. Subgoal

Evaluate whether the live dashboard can present trustworthy and timely information despite provider failures, stale readings, unavailable sources, and authority workflow delays.

## 3. Questions and Metrics

| Question | Metric | Evidence source | Interpretation |
|---|---|---|---|
| Q1. Is the code structurally manageable? | LOC, cyclomatic complexity per function, comment ratio, duplication | `scripts/t2-code-metrics.js`, ESLint output | Lower unnecessary complexity/duplication and understandable size indicate better maintainability. |
| Q2. Are external data providers reliable? | Request count, success rate, p50/p95 latency, failure causes | `logs/fetch-log.jsonl`, `scripts/log-summary.js` / `scripts/log-analysis.js` | Identifies dependable and problematic providers. |
| Q3. How much data is live, stale, or unavailable? | Live %, stale %, unavailable % | Normalised reading state in the dashboard/logs | Shows current data freshness and coverage. |
| Q4. Are data sources trustworthy? | Trust score by reading/provider | Shared data layer trust score | Higher scores indicate fresher, more complete, better-sourced readings. |
| Q5. Does the authority workflow operate efficiently? | Approval rate, time-to-approve, rejected/closed counts | Authority workflow metrics endpoint/audit log | Measures operational responsiveness. |
| Q6. Does the system remain correct under tests? | Tests passed / tests executed; coverage % | `npm test`, coverage tool | Verifies functional correctness and test depth. |
| Q7. What issues remain? | Defect count by severity/status | `docs/defect-log.md` + test/log evidence | Tracks known quality gaps without inventing failures. |

## 4. Measurement rules

1. Every numerical result must have an evidence source.
2. A provider failure is reported as a failure; it is not silently converted into a success.
3. Missing API credentials are recorded as configuration-related unavailability.
4. Test pass rate is not treated as code coverage.
5. Trust scores are displayed only when produced by the project's data layer.
6. Authority metrics are displayed only when produced by the authority workflow endpoint or audit records.

## 5. T2 acceptance criteria

- `docs/gqm-plan.md` is present and linked to measurable evidence.
- Code metrics are reproducible from the repository.
- The System Quality dashboard can display live/stale/unavailable state, provider quality, trust information, and authority workflow metrics when those sources are available.
- Coverage is measured separately from test pass rate.
- A defect log exists.
- `docs/metrics-report.md` explains every reported number and its source.

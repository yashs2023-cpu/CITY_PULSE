# CityPulse Software Metrics Report

**Owner:** T2 — Purushottam  
**Evidence source:** `analysis.json` (log-analysis output supplied with the project ZIP)  
**Analysis generated:** 26 October 2026, 11:10:46 UTC

## 1. Purpose and GQM summary

This report evaluates CityPulse's observed provider-request performance and defines how the dashboard should communicate live-data quality. The GQM plan links the overall goal—credible, timely, transparent city data—to measurable questions about availability, latency, freshness, completeness, trust, and authority workflow behaviour.

The supplied analysis contains **257 logged request entries** across four sources. Its source-specific first/last timestamps span **25 October 2026, 07:04:16 UTC to 26 October 2026, 11:10:37 UTC** (approximately 28 hours 6 minutes overall). This is a short captured sample, not a long-term availability study.

## 2. Collection method

The project uses JSON Lines logs at `logs/fetch-log.jsonl`; each line is a separate JSON object. The existing `scripts/log-summary.js` groups dashboard fetch attempts by source and reports request count, success percentage, p50/p95 latency, time range, and failure causes. `analysis.json` is the supplied analysis artifact and is treated as the source of the figures below. The project uses Node.js (package requirement: Node.js 18 or newer). Exact Node version and tool execution transcript were not embedded in the supplied analysis artifact and are therefore not asserted here.

Latency percentiles are reported only for successful requests with recorded durations. Success rate is `okCount / total × 100` for the logged sample. It is an observed request success rate, not a claim that the provider was continuously available throughout the entire window.

## 3. Results

### 3.1 Provider request performance

| Source | Requests (n) | Successful (n) | Sample success rate | p50 latency | p95 latency | Source time window (UTC) |
|---|---:|---:|---:|---:|---:|---|
| Notices | 122 | 122 | 100% | 12 ms | 94 ms | 25 Oct 2026 07:04:16 – 26 Oct 2026 11:10:28 |
| Air quality | 17 | 17 | 100% | 929 ms | 2,268 ms | 25 Oct 2026 07:04:17 – 26 Oct 2026 11:02:07 |
| Weather | 21 | 21 | 100% | 777 ms | 2,257 ms | 25 Oct 2026 07:04:17 – 26 Oct 2026 11:07:08 |
| Traffic | 97 | 97 | 100% | 1,002 ms | 2,287 ms | 25 Oct 2026 07:04:17 – 26 Oct 2026 11:10:37 |
| **All sources** | **257** | **257** | **100% in this sample** | — | — | 25 Oct 2026 07:04:16 – 26 Oct 2026 11:10:37 |

The all-source total is 257 requests (122 + 17 + 21 + 97). Per-source sample sizes differ substantially. Notices have the largest sample (n=122); air quality has the smallest (n=17), so comparisons involving air quality should be treated cautiously. The analysis reports no top failure causes for these source samples. A 100% sample success rate does not establish that there were no gaps between requests or that the providers are continuously available.

### 3.2 Freshness and status distribution

The dashboard computes reading trust and status from the current in-memory reading store, source last-success time, configured refresh interval, and timestamps. The supplied `analysis.json` is a request summary plus metric-reading history; it does **not** contain a complete snapshot of all readings simultaneously displayed on the dashboard, so a defensible live/stale/unavailable percentage cannot be calculated from this artifact alone. The System Quality page should calculate these shares from the current store at runtime and show “No data yet” when the denominator is zero.

### 3.3 Completeness and trust score

Each normalized reading is scored for completeness across eight required fields: metric, label, value, unit, location, source, observedAt, and fetchedAt. The trust score combines freshness (40%), source type (40%), and completeness (20%). The source-type weights and thresholds are defined by the project; they are not calibrated against an external ground-truth dataset. Consequently, the trust score is an internal consistency indicator rather than a statistically validated probability of correctness.

The analysis artifact does not provide a trustworthy aggregate distribution of trust scores for all currently displayed readings. Such a distribution should be calculated from live `store.r` data when the dashboard runs, rather than hardcoded into this report.

### 3.4 Authority workflow metrics

The authority server exposes `/api/admin/workflow-metrics` behind authentication. It returns total reports, approval rate and sample size, approved/rejected counts, mean approval time and the sample size used for approval-time calculations. The supplied `analysis.json` includes metric readings for authority-related counters, but it does not provide the full workflow endpoint response or report-level approval-duration sample. Therefore, this report does not claim an approval rate or time-to-approve value from those counters. The System Quality page must display “No data yet” when the workflow endpoint is not connected or the relevant sample size is zero.

### 3.5 Code metrics and test coverage

LOC, per-function cyclomatic complexity, comment ratio, duplication, statement coverage, and branch coverage require a recorded static-analysis or coverage tool run. The supplied `analysis.json` does not contain those measurements, so they are not invented here. Commit the actual tool output and coverage report under `docs/evidence/` before adding numeric results to this section.

## 4. Interpretation

- The observed request success rate is 100% across 257 entries in this short sample. This is encouraging for the captured period but is not a service-level guarantee.
- Notices show lower recorded request latency than the external data sources. Air quality, weather, and traffic have p95 latencies above two seconds in this sample, suggesting that the interface should communicate loading and unavailable states clearly.
- The weather and air-quality samples are small (n=21 and n=17), limiting confidence in percentile comparisons.
- A transparent “No data yet” state is preferable to displaying zero when a metric has no valid observations. Zero is a measurement; missing is a lack of evidence.
- Runtime freshness, completeness, trust, and workflow metrics should be computed from their source-of-truth data rather than copied from a previous analysis snapshot.

## 5. Known limitations and threats to validity

1. **Short log window:** the supplied log analysis covers approximately 28 hours, which is too short to infer long-term availability, weekly patterns, or service-level reliability.
2. **Browser-direct logging:** weather and air-quality requests are logged only while the dashboard browser tab is open. The log therefore under-represents periods when no user has the dashboard open.
3. **Project-defined trust weights:** freshness/source/completeness weights and source-type scores are project choices, not empirically calibrated against independent ground truth.
4. **Unequal sample sizes:** per-source n varies from 17 to 122, affecting percentile stability and comparison quality.
5. **Request success is not continuous uptime:** successful logged fetches do not prove every moment between requests was available.
6. **No full runtime snapshot:** `analysis.json` is not a complete, simultaneous snapshot of live/stale/unavailable readings.
7. **Workflow and code-metric gaps:** a complete authority workflow response and static-analysis/coverage output were not present in this artifact; those results remain unreported rather than estimated.

## 6. Improvements and follow-up actions

- Add a System Quality page that derives live/stale/unavailable shares and trust summaries from current readings.
- Display provider success rate and p50/p95 with sample size and the source-specific time window.
- Display “No data yet” when log history, workflow metrics, or runtime readings are missing; do not substitute zero.
- Capture a longer log window and, where appropriate, arrange server-side collection for browser-direct sources.
- Run and commit code-metric and test-coverage tool output; track defects with status and evidence.
- Keep trust-score weights labelled as project-defined until validated against independent outcomes.

## 7. Reproducibility and evidence

Primary source: `analysis.json`, generated 26 October 2026 at 11:10:46 UTC, with 257 total entries and source-specific first/last timestamps shown in Section 3.1. The original JSON artifact should be retained under `docs/evidence/analysis.json` in the repository so the report's values can be traced. Do not claim code-metric, coverage, live/stale distribution, or workflow-duration results until the corresponding tool output or endpoint response is saved.

# T2 Evidence — Previously Obtained Project Results

These results were obtained from the CITY-PULSE project during the T2 analysis work and should be re-run against the final `t2-metrics` branch before submission.

## Test suite

| Metric | Result | Evidence |
|---|---:|---|
| Checks passed | 30 | Existing project test run |
| Checks executed | 30 | Existing project test run |
| Test pass rate | 100% | 30 / 30 |

## Code analysis

| Finding | Result | Evidence |
|---|---:|---|
| ESLint errors | 0 | Existing ESLint run |
| ESLint warnings | 4 | Existing ESLint run |
| `createServer` complexity | 16 | Existing ESLint/code-complexity run |
| Async function complexity | 59 | Existing ESLint/code-complexity run |
| Async arrow complexity | 22 | Existing ESLint/code-complexity run |
| Async arrow complexity | 22 | Existing ESLint/code-complexity run |

## Provider/log analysis

| Provider | Fetches | Success | p50 | p95 |
|---|---:|---:|---:|---:|
| Notices | 112 | 84.8% | 13 ms | 46 ms |
| Traffic | 29 | 0% | not available | not available |
| Weather | 18 | 100% | 705 ms | 2339 ms |
| Air Quality | 16 | 100% | 916 ms | 1594 ms |

### Observations

- Traffic was unavailable in this run because `TOMTOM_API_KEY` was not configured.
- Notices had failed fetches when the Authority server was unreachable during the run.
- No data gaps were detected by the log-analysis run.
- Extended `readings[]` metrics were not present in the available log evidence at the time of analysis.

## Metrics that still require a final-repository run

- Exact LOC by file/function.
- Comment ratio.
- Duplication percentage.
- Coverage percentage.
- Live/stale/unavailable percentages from the final reading stream.
- Trust-score distribution from the final data layer.
- Authority time-to-approve and approval rate from the workflow-metrics endpoint/audit data.

These are deliberately not fabricated.

# T2 Defect / Quality Issue Log

This log records observed quality issues from the available evidence. Configuration or environment problems are not presented as application defects without qualification.

| ID | Issue | Severity | Status | Evidence | Action |
|---|---|---|---|---|---|
| T2-01 | Traffic provider unavailable because `TOMTOM_API_KEY` was not configured during the log run. | Major | Configuration pending | Provider log analysis | T1/lead should configure the key and re-run traffic checks. |
| T2-02 | Notices requests failed during periods when the Authority server was unreachable. | Major | Environment/dependency issue | Notices log analysis | Keep graceful unavailable state and verify Authority server availability. |
| T2-03 | High cyclomatic complexity detected in several async/server functions. | Major | Refactoring candidate | ESLint/code-complexity output | Refactor only with owner/lead approval; add regression tests before/after. |
| T2-04 | Coverage percentage was not available in the evidence collected so far. | Minor | Measurement pending | T2 evidence review | Run the repository's coverage command and commit the generated report. |
| T2-05 | Extended reading-level metrics were not logged in the available evidence. | Minor | Dependency pending | Log analysis | Coordinate with lead to enable metric-value logging, then re-run T2 analysis. |

## Severity rule

- **Major:** prevents or materially degrades a quality requirement or important provider workflow.
- **Minor:** does not block the core application but leaves an evidence/quality gap.

## Closure rule

An item is closed only when a new tool run/log/test provides evidence that the issue was fixed or the required measurement became available.

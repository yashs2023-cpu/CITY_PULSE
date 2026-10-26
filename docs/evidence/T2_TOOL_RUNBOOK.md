# T2 tool evidence runbook

## Runtime and test evidence
Run from the repository root:

```bash
node --version
npm test
node scripts/log-summary.js
```

Save the terminal output and date/time here as evidence before the pull request. The supplied `analysis.json` is the source for the provider request figures in `metrics-report.md`.

## Coverage
Coverage target is 80%+. It is not claimed as achieved by this bundle. If the project adds/uses a coverage runner, run it and save its actual output here. Do not substitute the number of passing tests for coverage.

## Static code metrics
Record tool name/version, included files, exclusions, and raw output for LOC, per-function cyclomatic complexity, comment ratio, and duplication. No unexecuted values should be entered as measured results.

# T3 Analytics Notes

## Commands
- `node tests/analyze-citypulse-tests.js`
- `node scripts/analyze-citypulse.js`
- `node scripts/analyze-citypulse.js --json`
- `node scripts/analyze-citypulse.js --interval-hours=24 --rain-window-minutes=60`

## What it calculates
- Longer-interval changes for congestion/traffic and rain/precipitation metrics when two same-location observations are separated by at least the configured interval.
- Pearson correlation between rain and congestion observations paired by identical location label and nearest timestamp within the configured window.

## Interpretation
These are descriptive analyses of the readings actually present in `logs/fetch-log.jsonl`. No data are generated or imputed. A missing log or no usable readings produces zero observations and unavailable correlation, not fabricated results.

The current dashboard's fetch logger sends fetch status (`source`, `ok`, `ms`, `error`) and may not include metric readings. Therefore this script may report no observations until the logging contract is extended by the project owner/lead. T3 can develop and test the analysis code independently, but should not modify shared server or dashboard code without coordination.

Correlation is not causation. Different locations or poorly aligned timestamps should not be compared; this implementation requires the same location label and uses a configurable timestamp window. The available provider values may be model-based or derived, not ground-sensor truth.

## Results template
- Log period:
- Usable metric observations:
- Congestion interval changes:
- Rain interval changes:
- Rain/congestion matched pairs (`n`):
- Pearson correlation (`r`):
- Data limitations:

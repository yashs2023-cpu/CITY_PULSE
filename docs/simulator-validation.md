# CityPulse Simulator Validation — T3

## Purpose
Compare projected congestion values against later observed congestion readings. Do not describe the simulator as validated until real matched observations exist.

## Pairing rule
Pair readings only when `metric` is `congestion`, scenario, location and `pairId` match, and a later `observed_outcome` exists within 24 hours of the `scenario_prediction`. Values must be percentages from 0 to 100.

## Metrics
For each scenario:
- `n`: number of matched prediction/outcome pairs.
- `MAE`: mean absolute error in congestion percentage points.
- `bias`: mean (predicted minus observed) error. Positive means predictions tend to be higher than observed.

## Required log fields
Each item in `/api/log` `readings[]` needs:
`metric`, `value`, `unit`, `location`, `observedAt`, `dataType`, `scenario`, and `pairId`.
Use `dataType: "scenario_prediction"` for predictions and `dataType: "observed_outcome"` for subsequent observations. `observedAt` must be an ISO timestamp. The current server may discard `scenario` and `pairId`; coordinate with the project lead before changing `server.js`.

## Running
`node tests/evaluate-simulator-tests.js`
`node scripts/evaluate-simulator.js`
Optional: `node scripts/evaluate-simulator.js --json`

## Results
Fill this section only from real log data:
- Data period:
- Sources:
- Matched pairs (`n`):
- MAE:
- Bias:
- Scenario-specific results:

If there are no matched real pairs, report `n = 0` and that validation is inconclusive. Synthetic test fixtures test the calculation only and are not evidence of real-world predictive accuracy.

## Limitations
Traffic API values may be current snapshots rather than ground-truth future observations. Weather or traffic correlation is not causal evidence. Document data source, timestamp alignment and missing data.

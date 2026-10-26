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

- Data period: Not determined from valid prediction/outcome pairs.
- Sources: `docs/evidence/fetch-log-sample.jsonl`
- Total log rows: 296
- Matched pairs (`n`): 0
- MAE: Not calculable
- Bias: Not calculable
- Scenario-specific results: None

The evaluator reported 0 matched prediction/outcome pairs. Therefore, simulator validation is inconclusive for this sample. No predictive accuracy metrics are reported.

Synthetic test fixtures test the calculation logic only and are not evidence of real-world predictive accuracy. 

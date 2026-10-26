# T2 System Quality Dashboard

## Purpose

The System Quality section is intended to sit inside the main CITY-PULSE browser dashboard, alongside the existing dashboard modules.

## Required cards

1. **Live readings** — percentage of normal/live readings.
2. **Stale readings** — percentage of readings past the freshness threshold.
3. **Unavailable readings** — percentage of readings with no usable source.
4. **Provider uptime/success** — per-provider request count and success rate.
5. **Latency** — p50 and p95 where the log contains enough observations.
6. **Trust score** — distribution/average only when emitted by the shared data layer.
7. **Authority workflow** — approval rate and time-to-approve only when emitted by the authority workflow metrics endpoint.

## Data-state formula

For a set of N normalised readings:

- Live % = live readings / N × 100
- Stale % = stale readings / N × 100
- Unavailable % = unavailable readings / N × 100

The three percentages should sum to 100% when every reading has exactly one state.

## Provider success formula

Success rate = successful fetches / total fetches × 100

Failure rate = failed fetches / total fetches × 100

## Authority formulas

Approval rate = approved reports / reports reaching a decision × 100

Time-to-approve = approval timestamp − submission timestamp, measured only for approved reports with both timestamps.

## UI behavior

- Show a neutral `Unavailable` state when a provider is down.
- Do not display a stale value as live.
- Show the observation/fetch timestamp when available.
- Keep one provider failure from hiding unrelated provider cards.
- Do not expose credentials or `.env` values.

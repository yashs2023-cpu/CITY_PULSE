# L5 — PR Review Checklist & Merge Guide

Use this for every pull request before merging into `main`.

## 1. Ownership gate (check first, takes 30 seconds)

| Files changed | Expected owner | Action if wrong owner |
|---|---|---|
| `server.js`, `project_citypulse.html` data layer, `CI`, `README.md`, trust score | Lead | Request changes, do not merge |
| `config.json`, `DATA_SOURCES.md`, `admin/`, sensor/transit providers | T1 | OK to review and merge |
| `docs/gqm-plan.md`, `docs/metrics-report.md`, System Quality section, `tests/` | T2 | OK to review and merge |
| `scripts/evaluate-simulator.js`, Simulator section, Analytics section | T3 | OK to review and merge |
| CSS only, `docs/browser-test-report.md`, `docs/demo-script.md`, `docs/qa-sheet.md`, `admin/admin.html`, `admin/report.html` | T4 | OK to review and merge |

If a T1 fix **requires** a change to a Lead file (`server.js` or data layer), the teammate must describe the needed change in the PR description. The Lead applies it on a separate commit on `main` (not the teammate's branch).

---

## 2. No invented numbers rule (non-negotiable)

Check every number that appears in the diff:

- [ ] Is it from a provider API response field? (TomTom, Open-Meteo, CAMS)
- [ ] Is it from a documented formula applied to a live reading? (congestion %, trust score, simulator projections)
- [ ] Is it from an authority-approved notice?
- [ ] If it is a scenario coefficient, is it explicitly labelled "assumption, not validated"?

**Reject** if any number is hard-coded from observation, invented, or from an undocumented source.

---

## 3. Reading format (non-negotiable)

Every new reading stored in `store.r` must have all 9 fields:

```
metric  label  value  unit  location  source  observedAt  fetchedAt  dataType
```

Plus the computed `trustScore` (added automatically by `putReading`). Check the diff does not add a 10th non-standard field without a corresponding test.

Valid `dataType` values: `sensor`, `provider`, `model`, `derived`, `authority`, `proj`, `na`.

---

## 4. Tests

- [ ] `npm test` output attached to the PR description (copy-paste the full output).
- [ ] New functionality has at least one new test in `tests/run-tests.js` or `tests/admin-tests.js`.
- [ ] Test count must be ≥ previous count (no test deletions without a reason).

---

## 5. CI badge

Check the CI badge in README is green before merging. If it is red, ask the author to fix failing tests first.

---

## 6. Security spot-checks

- [ ] No `.env` file or API key value committed (check `git diff` for strings that look like keys).
- [ ] No `console.log` that prints a key or password.
- [ ] New HTML user-facing strings go through `esc()` before being inserted into `innerHTML`.

---

## 7. Single-file HTML merge conflicts

`project_citypulse.html` is the most conflict-prone file. Tips:

1. **Keep sections separate.** T2 owns the System Quality section (its own `<section id="quality">`); T3 owns the Simulator and Analytics sections. Conflicts usually happen only at the shared `<script>` block.
2. **Conflict resolution order:** Accept the Lead version for the data layer (`store`, `putReading`, `trustScore`, pollers). Accept T2/T3/T4 changes only in their own sections.
3. **After resolving:** always run `npm test` locally before pushing the resolved merge commit.
4. **One PR at a time:** do not merge two PRs that both touch `project_citypulse.html` at the same time. Merge one, ask the other to rebase, then merge.

---

## 8. Merge checklist (Lead runs this before clicking Merge)

```
[ ] Ownership check passed (Section 1)
[ ] No invented numbers (Section 2)
[ ] Reading format intact (Section 3)
[ ] npm test green (Section 4)
[ ] CI badge green (Section 5)
[ ] No secrets committed (Section 6)
[ ] HTML escape used for new user-facing strings (Section 6)
[ ] Conflict resolved correctly if project_citypulse.html touched (Section 7)
[ ] Merge commit message: "Merge PR#N — <one-line description>"
```

---

## 9. Release checklist (Day 11-13, L5 phase 2)

1. All teammate PRs merged and `main` green.
2. Feature freeze — no new features after this point.
3. Full demo run ×3:
   - Normal run: all 4 sources live, check all sections render numbers.
   - Failure demo: disconnect network, confirm stale labels appear, no numbers invented, simulator shows "Missing baseline" if traffic stale.
   - Recovery demo: reconnect, confirm readings update, stale labels clear.
4. Run `node scripts/log-summary.js` and include output in `docs/metrics-report.md`.
5. Run `node scripts/evaluate-simulator.js` (T3) and include output.
6. Tag: `git tag -a v1.0 -m "CityPulse final release — Software Metrics"` then `git push origin v1.0`.

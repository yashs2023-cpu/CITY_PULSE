# Evidence B — Sensor Air Quality Source Investigation

**Item:** Determine whether a ground-sensor air quality feed (OpenAQ, CPCB) exists for Chennai that can be integrated as `dataType: "sensor"`.

| Field | Value |
|---|---|
| Date & time | 2026-10-26, approx. 16:30 IST |
| Run by | T1 — Data integration and reliability (Shivani) |

---

## B1 — OpenAQ query for Chennai stations

OpenAQ v3 API — **requires a free API key**, sent in the `X-API-Key` header (register at https://explore.openaq.org). Requests without a key are rejected.

```powershell
$h = @{ "X-API-Key" = "<YOUR_OPENAQ_KEY>" }
$r = Invoke-RestMethod -Headers $h "https://api.openaq.org/v3/locations?coordinates=13.0827,80.2707&radius=25000&limit=20"
$r.results | Select-Object id, name, @{n='params';e={($_.sensors.parameter.name) -join ','}}, @{n='last';e={$_.datetimeLast.utc}}
```

Latest measurements for one location (station 5655):

```powershell
$loc = Invoke-RestMethod -Headers $h "https://api.openaq.org/v3/locations/5655"
$lat = Invoke-RestMethod -Headers $h "https://api.openaq.org/v3/locations/5655/latest"
$s = @{}; $loc.results[0].sensors | ForEach-Object { $s[$_.id] = $_.parameter.name }
$lat.results | Where-Object { $s[$_.sensorsId] -eq 'pm25' } | Select-Object @{n='param';e={$s[$_.sensorsId]}}, value, @{n='utc';e={$_.datetime.utc}}
```

**What makes a station usable:**
- Located in Chennai (within 25 km of the city centre)
- Last update within the past 7 days
- Has `pm25` in its parameters
- Fixed station (not mobile)

**Pass criteria:** station found, last update < 7 days, `pm25` value present with a timestamp.

### B1 result

The query returned 10 stations within 25 km of 13.0827, 80.2707.

| ID | Station | Has pm25 | Last update | Usable? |
|---|---|---|---|---|
| 378 | Alandur Bus Depot | yes | 2018 | No — stale |
| 2461 | US Diplomatic Post: Chennai | yes | 2016 | No — stale |
| 2549 | IIT | yes | 2018 | No — stale |
| 5655 | Velachery Res. Area, Chennai - CPCB | yes | 2026-10-23T15:30Z (latest pm25) | **Yes** |
| 11578 | Royapuram, Chennai - TNPCB | yes | 2026-10-23T15:30Z | Yes |
| 11579 | Kodungaiyur, Chennai - TNPCB | yes | 2026-10-23T15:30Z | Yes |
| 11581 | Arumbakkam, Chennai - TNPCB | yes | 2026-10-23T15:30Z | Yes |
| 12046 | Perungudi, Chennai - TNPCB | yes | 2026-10-23T15:30Z | Yes |
| 2586 | Manali, Chennai - CPCB | yes | 2026 (full timestamp not captured) | Not confirmed |
| 8558 | Chennai | yes | 2026 (full timestamp not captured) | Not confirmed |
| 10780 | Manali Village, Chennai - TNPCB | yes | 2026 (full timestamp not captured) | Not confirmed |

Latest PM2.5 at station 5655 (Velachery Res. Area, CPCB):

```
param value utc
----- ----- ---
pm25  15.39 2026-10-23T15:30:00Z
pm25  32.0  2022-10-31T01:45:00Z   <- old retired sensor, ignored
```

**Pass / Fail: Pass.** A Chennai station exists with a pm25 value dated 3 days before the check (< 7 days).

**Caveats:**
- The newest data was 3 days old at the time of the check, so this feed lags real time and should be shown with its timestamp, not as "live".
- This single PM2.5 value (15.39 µg/m³, 2026-10-23) was not taken at the same time as the Open-Meteo CAMS value in A3 (62.2 µg/m³, 2026-10-26), so the two should not be compared directly.

---

## B2 — CPCB investigation

**Not checked directly.** The OpenAQ results already include stations operated by CPCB (Velachery Res. Area, Manali), so CPCB-sourced data is reachable through OpenAQ. A direct data.gov.in query was not run.

**Pass criteria (if checked later):** response contains a Chennai station row with `pollutant_avg` and `last_update` within 24 hours.

---

## B3 — Decision and outcome

| Source | Checked | Result | Usable? |
|---|---|---|---|
| OpenAQ stations near Chennai | 2026-10-26 | Found. 5 stations with pm25 data dated 2026-10-23 | Yes (data ~3 days old) |
| CPCB via data.gov.in | Not checked | CPCB stations are available through OpenAQ | N/A |

**Decision:** document as **available**.

A possible follow-up (not done here) is to implement a `fetchSensorAir()` provider in `project_citypulse.html` returning readings with `dataType: "sensor"`, shown alongside the CAMS model value and never replacing it. `project_citypulse.html` is a Lead file, so that change should be proposed in a PR for Lead to review.

## Result summary

```
OpenAQ: https://api.openaq.org/v3/locations?coordinates=13.0827,80.2707&radius=25000&limit=20
        2026-10-26 | 10 Chennai stations; station 5655 (Velachery, CPCB) pm25 = 15.39 at 2026-10-23T15:30Z -> pass (< 7 days old)
CPCB:   not checked directly (CPCB-run stations appear via OpenAQ)
Decision: sensor feed available via OpenAQ; document with timestamp and ~3-day lag
```
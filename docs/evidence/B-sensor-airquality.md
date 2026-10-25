# Evidence B — Sensor Air Quality Source Investigation

**Item:** Determine whether a ground-sensor air quality feed (OpenAQ, CPCB) exists for Chennai that can be integrated as `dataType: "sensor"`.

| Field | Value |
|---|---|
| Date & time | To be filled by T1 after investigation |
| Run by | T1 — Data integration and reliability |

---

## B1 — OpenAQ query for Chennai stations

OpenAQ v3 API — no key required for basic queries:

```bash
# List stations (locations) within 25 km of Chennai city centre
curl -s "https://api.openaq.org/v3/locations?\
coordinates=13.0827,80.2707&radius=25000&limit=20" | \
  node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
  (d.results||[]).forEach(s=>console.log(s.id,s.name,s.city,s.country,
  s.lastUpdated,s.parameters.map(p=>p.parameter).join(',')));"
```

**What makes a station usable:**
- `country: "IN"`, city near Chennai
- `lastUpdated` within the past 7 days
- Has `pm25` or `pm2.5` in parameters
- `isMobile: false` (fixed station)

If stations are found, get the latest measurements:

```bash
# Replace LOCATION_ID with the id from above
curl -s "https://api.openaq.org/v3/locations/LOCATION_ID/latest" | \
  node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
  (d.results||[]).forEach(r=>console.log(r.parameter,r.value,r.unit,r.datetime));"
```

**Pass criteria:** station found, `lastUpdated` < 7 days, `pm25` value present with a timestamp.

---

## B2 — CPCB investigation

CPCB (Central Pollution Control Board) runs the National Air Quality Index for India.

**Step 1 — Check the CPCB AQI portal for Chennai stations:**
- Open: https://airquality.cpcb.gov.in/ccr/#/caaqm-dashboard-all/caaqm-landing/data
- Select State: Tamil Nadu, City: Chennai
- Note the station names visible in the UI

**Step 2 — Check data.gov.in for a CPCB API:**
```bash
curl -s "https://api.data.gov.in/resource/3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69?\
api-key=YOUR_DATA_GOV_IN_KEY&format=json&filters[city]=Chennai&limit=5"
```
(Free key from https://data.gov.in/user/register)

**Pass criteria:** response contains a Chennai station row with `pollutant_avg` and `last_update` within 24 hours.

---

## B3 — Decision and outcome

| Source | Checked | Result | Usable? |
|---|---|---|---|
| OpenAQ stations near Chennai | *(fill date)* | *(fill: found / not found / stale)* | *(yes / no)* |
| CPCB via data.gov.in | *(fill date)* | *(fill)* | *(yes / no)* |

**If a feed is usable:**
- Implement a new provider function `fetchSensorAir()` in `project_citypulse.html` returning readings with `dataType: "sensor"`.
- Show the sensor value alongside the CAMS model value (do not replace it).
- Since `project_citypulse.html` is a Lead file, describe the required change in a PR and ask Lead to review and merge.
- Add a new entry to `SOURCES` in the data layer and call `putReading('sensorAir', ...)`.

**If no feed is usable:**
- Document each attempt (URL, date, response summary) in `DATA_SOURCES.md` under "Not connected".
- A documented "none found" is acceptable for the deliverable; a vague "not verified" is not.
- Update the `DATA_SOURCES.md` table to show the specific response received and the reason it was rejected.

---

## Result summary (fill after investigation)

```
OpenAQ: [URL tried] [date] [response summary] → [pass/fail reason]
CPCB:   [URL tried] [date] [response summary] → [pass/fail reason]
Decision: [integrate / document as unavailable]
```

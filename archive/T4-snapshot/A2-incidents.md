# Evidence A2 — Incidents API Verification

**Item:** TomTom Incidents API — `incidents.ok=true`, no 400 field-rejection error.

| Field | Value |
|---|---|
| Date & time | To be filled by T1 after live run |
| Run by | T1 — Data integration and reliability |
| URL | `http://localhost:3000/api/traffic` (same response as A1) |

## What to check

In the `/api/traffic` JSON response, look at the `incidents` object:

```json
"incidents": {
  "ok": true,
  "items": [ ... ]
}
```

If `ok` is `false`:
```json
"incidents": {
  "ok": false,
  "items": [],
  "error": "HTTP 400"
}
```
A **400** means TomTom rejected one of the field names in `INC_FIELDS` (server.js line ~17).

## Current INC_FIELDS value (server.js)

```
{incidents{type,geometry{type,coordinates},properties{id,iconCategory,magnitudeOfDelay,
events{description,code,iconCategory},startTime,endTime,from,to,length,delay,
roadNumbers,timeValidity,lastReportTime}}}
```

## If you get a 400 — field-by-field diagnosis

Run these reduced queries to isolate the bad field (replace `YOUR_KEY` and `BBOX`):

```bash
# Minimal — should always work
curl -s "https://api.tomtom.com/traffic/services/5/incidentDetails\
?key=YOUR_KEY&bbox=80.15,12.96,80.39,13.20\
&fields=%7Bincidents%7Btype%2Cgeometry%7Btype%2Ccoordinates%7D%2Cproperties%7Bid%2CiconCategory%7D%7D%7D\
&language=en-GB&timeValidityFilter=present"
```

Fields added in recent TomTom API versions that may not exist on free tier: `lastReportTime`. If the error disappears without it, remove `lastReportTime` from `INC_FIELDS` in `server.js` (**Lead file — tell Lead the exact change**).

## Result

| Field | Value |
|---|---|
| `incidents.ok` | *(fill after run)* |
| `incidents.items.length` | *(fill after run)* |
| Error (if any) | *(fill after run)* |
| Pass / Fail | *(fill after run)* |
| Fix applied | *(if INC_FIELDS changed, note the exact change and commit ref)* |

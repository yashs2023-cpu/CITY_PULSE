# CityPulse data sources

| | Open-Meteo Forecast | Open-Meteo Air Quality | TomTom Traffic Flow | TomTom Traffic Incidents |
|---|---|---|---|---|
| Docs | open-meteo.com/en/docs | open-meteo.com/en/docs/air-quality-api | developer.tomtom.com/traffic-api | developer.tomtom.com/traffic-api/traffic-api-documentation-traffic-incidents/incident-details |
| Endpoint | `api.open-meteo.com/v1/forecast` | `air-quality-api.open-meteo.com/v1/air-quality` | `api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json` | `api.tomtom.com/traffic/services/5/incidentDetails` |
| Auth | none | none | API key (server `.env`) | API key (server `.env`) |
| Metrics used | temperature, humidity, feels-like, precipitation, weather code, wind (current); hourly temperature (past 24 h) | us_aqi, pm2_5, pm10, ozone, nitrogen_dioxide (current); hourly us_aqi, pm2_5 (past 24 h) | currentSpeed, freeFlowSpeed, travel times, confidence, roadClosure | category, description, from/to, delay, start/end, timeValidity |
| Coverage | global model | CAMS global (~45 km) / European (~11 km, Europe only) | road segments nearest each sample point | bbox = city ± `bboxRadiusDeg` |
| Data type | model estimate | model estimate (not sensors) | provider-reported | provider-reported reports |
| Timestamp field | `current.time` (unix, `timeformat=unixtime`) | `current.time` | none — fetch time used (≈) | `startTime`/`endTime`/`lastReportTime` |
| Update frequency | current: 15-min model steps | hourly model; forecast refreshed daily | updated frequently (~minute-level per TomTom) | updated every minute (per TomTom SDK docs) |
| Licence / attribution | CC BY 4.0 style attribution to Open-Meteo.com; free tier non-commercial | must credit **CAMS ENSEMBLE data provider** and Open-Meteo | "Traffic data © TomTom"; subject to TomTom terms | same |
| Limits | free tier fair-use | free tier fair-use | free tier daily request cap; ~6 calls/cycle here | counted with the above |

Dashboard polling: 600 s / 900 s / 300 s (configurable; minimums 300 / 300 / 120 s).

## Not connected (no verified feed) — shown as Unavailable
Noise levels · public transport status & passenger counts · crowd density/station occupancy · public events · streetlight/water/power outage data · asset-health or failure-risk scoring.

**Sensor air quality:** a ground-sensor feed does exist for Chennai via OpenAQ (see B below), but it is **not yet integrated**. The dashboard still shows only the CAMS model values, labelled `dataType: "model"`. Do not label model values as sensor data.

**Transit:** no documented public GTFS / GTFS-Realtime endpoint was verified for CMRL, MTC, data.gov.in or Greater Chennai Corporation. Details: [docs/evidence/C1-transit.md](docs/evidence/C1-transit.md) (checked 2026-10-26).

## T1 source investigation (checked 2026-10-26)

This is a discovery check, not evidence that the agencies have no feeds.

| Candidate | Source checked | Finding |
|---|---|---|
| OpenAQ | v3 API (`/v3/locations`, key required) | **Found.** 10 stations within 25 km of Chennai centre. Station 5655 (Velachery Res. Area, CPCB) returned PM2.5 = 15.39 µg/m³ at 2026-10-23T15:30Z (about 3 days old at time of check). Four TNPCB stations (11578, 11579, 11581, 12046) also last updated 2026-10-23T15:30Z. Three older stations (378, 2461, 2549) last updated 2016–2018 and are not usable. Details: [docs/evidence/B-sensor-airquality.md](docs/evidence/B-sensor-airquality.md). |
| CPCB | via OpenAQ | CPCB-operated stations (Velachery, Manali) appear in OpenAQ. A direct data.gov.in / CPCB portal query was **not** run. |
| Chennai Metro Rail (CMRL) | Official site | No public developer/API page or GTFS endpoint verified. See C1. |
| Metropolitan Transport Corporation (MTC) | Official site | Website advertises live tracking for users, but no public API/GTFS-Realtime endpoint verified. Do not ingest website UI data as an open feed. See C1. |
| data.gov.in | Portal | No current Chennai transit feed verified. See C1. |
| Greater Chennai Corporation | Official site | No machine-readable transit feed verified. See C1. |

Next checks: decide whether to integrate OpenAQ station 5655 as `dataType: "sensor"` (shown alongside, not replacing, the CAMS value, with its timestamp and a "not live" note given the multi-day lag); ask MTC/CMRL for an official feed or documented GTFS endpoint.

## Live verification results

Run by T1 (Shivani) on 2026-10-26, from a local machine with `node server.js` running.

| Check | Result | Date | Evidence |
|---|---|---|---|
| A1: TomTom Flow, 5 corridors | **Pass.** All 5 corridors `ok=true`; matched positions within 0.005° of the intended coordinates in `config.json`. No config changes needed. TomTom reported the Anna Salai segment as closed at the time of the run. | 2026-10-26 | [A1-corridors.md](docs/evidence/A1-corridors.md) |
| A2: TomTom Incidents | **Pass.** `incidents.ok=true`, 224 items, no HTTP 400. `INC_FIELDS` unchanged. | 2026-10-26 | [A2-incidents.md](docs/evidence/A2-incidents.md) |
| A3-1: Open-Meteo Forecast | **Pass.** `current.time` present (1793010600); temperature 28.8 °C. | 2026-10-26 | [A3-openmeteo.md](docs/evidence/A3-openmeteo.md) |
| A3-2: Open-Meteo Air Quality (CAMS) | **Pass.** `current.time` present (1793008800); us_aqi 154, pm2_5 62.2 µg/m³. Model estimate, not a sensor. | 2026-10-26 | [A3-openmeteo.md](docs/evidence/A3-openmeteo.md) |
| B: Sensor air quality (OpenAQ) | **Found**, with a data lag of about 3 days. Not yet integrated. | 2026-10-26 | [B-sensor-airquality.md](docs/evidence/B-sensor-airquality.md) |
| C1: Transit open data | **No verified feed.** | 2026-10-26 | [C1-transit.md](docs/evidence/C1-transit.md) |
| D1: Log analysis | **C2 trial run done** (250 log lines, 100% success on all four sources, no failure causes, large downtime gaps). Final figures to be updated after the C3 run. | 2026-10-26 | [D1-log-analysis.md](docs/evidence/D1-log-analysis.md), [fetch-log-sample.jsonl](docs/evidence/fetch-log-sample.jsonl) |

Not checked: `hourly.time` array length for the Open-Meteo calls; CPCB via data.gov.in.

**Open observation (for Lead):** `inc_works`, `inc_closure`, `inc_flood` and `inc_acc` were 0 in every logged reading, while `inc_total` ranged 222–264. The incident category mapping may not match TomTom's `iconCategory` values; not yet investigated.
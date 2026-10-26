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
Noise levels · public transport status & passenger counts · crowd density/station occupancy · public events · streetlight/water/power outage data · asset-health or failure-risk scoring. Candidates to investigate: Chennai Metro / MTC open data or GTFS-Realtime, Greater Chennai Corporation / data.gov.in feeds, OpenAQ or CPCB for sensor-based air quality.

## T1 source investigation (checked 2026-10-25)

This is a discovery check, not evidence that the agencies have no feeds.

| Candidate | Official page checked | Finding |
|---|---|---|
| OpenAQ | [API documentation](https://docs.openaq.org/) | Documents geographic and measurement queries. No Chennai station/parameter response was verified in this check; do not label the CAMS model values as sensor data. |
| CPCB | [CPCB website](https://cpcb.gov.in/) | The landing page was reachable, but this check did not identify a documented, directly queryable Chennai station API/feed. |
| Chennai Metro Rail | [CMRL website](https://chennaimetrorail.org/) | Official website checked; no public real-time feed or GTFS endpoint was verified. |
| Metropolitan Transport Corporation | [MTC website](https://mtcbus.tn.gov.in/) | Website advertises live tracking services for users, but no public API/GTFS-Realtime endpoint was verified. Do not ingest website UI data as an open feed. |

Next checks: obtain a station-level OpenAQ/CPCB response with timestamp, Chennai station identity and units; ask MTC/CMRL for an official feed or documented GTFS endpoint. Until then, sensor air quality and transit data remain unavailable.

## Live verification checklist

### Status: commands ready — run from your machine with the server running

**A3-1 — Open-Meteo Forecast**
```bash
curl -s "https://api.open-meteo.com/v1/forecast?latitude=13.0827&longitude=80.2707&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&hourly=temperature_2m&past_days=1&forecast_days=1&timeformat=unixtime&timezone=Asia%2FKolkata"
```
Pass: `current.time` is a unix integer and `current.temperature_2m` is a number. See `docs/evidence/A3-openmeteo.md`.

**A3-2 — Open-Meteo Air Quality (CAMS)**
```bash
curl -s "https://air-quality-api.open-meteo.com/v1/air-quality?latitude=13.0827&longitude=80.2707&current=us_aqi,pm2_5,pm10,ozone,nitrogen_dioxide&hourly=us_aqi,pm2_5&past_days=1&forecast_days=1&timeformat=unixtime&timezone=Asia%2FKolkata"
```
Pass: `current.time` present and `current.us_aqi` is a finite number. See `docs/evidence/A3-openmeteo.md`.

**A1/A2 — TomTom Traffic (needs `TOMTOM_API_KEY` in `.env` and `node server.js` running)**
```bash
curl -s http://localhost:3000/api/traffic
```
Pass: all `corridors[].ok=true`; `incidents.ok=true`. Check each `matched` position against config.json coordinates. See `docs/evidence/A1-corridors.md` and `docs/evidence/A2-incidents.md`.

**B — Sensor air quality (OpenAQ)**
```bash
curl -s "https://api.openaq.org/v3/locations?coordinates=13.0827,80.2707&radius=25000&limit=20"
```
Pass: at least one Chennai station with `lastUpdated` < 7 days and `pm25` parameter. See `docs/evidence/B-sensor-airquality.md`.

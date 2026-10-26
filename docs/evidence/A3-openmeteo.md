# Evidence A3 — Open-Meteo Live Verification

**Item:** Confirm Open-Meteo Forecast and Air Quality APIs return valid current values for Chennai.

| Field | Value |
|---|---|
| Date & time | 2026-10-26, approx. 16:00 IST |
| Run by | T1 — Data integration and reliability (Shivani) |
| Coordinates | lat 13.0827, lon 80.2707 (Chennai city centre, from config.json) |

## Command 1 — Weather forecast

```bash
curl -s "https://api.open-meteo.com/v1/forecast?\
latitude=13.0827&longitude=80.2707\
&current=temperature_2m,relative_humidity_2m,apparent_temperature,\
precipitation,weather_code,wind_speed_10m\
&hourly=temperature_2m&past_days=1&forecast_days=1\
&timeformat=unixtime&timezone=Asia%2FKolkata"
```

**What to check:**
- Response has a `current` block
- `current.time` is a unix timestamp (integer, not null)
- `current.temperature_2m` is a number in a plausible Chennai range (18–45 °C)
- `hourly.time` is an array of 48 unix timestamps

**Pass if:** `current.time` is present and `temperature_2m` is a finite number.

## Command 2 — Air quality (CAMS)

```bash
curl -s "https://air-quality-api.open-meteo.com/v1/air-quality?\
latitude=13.0827&longitude=80.2707\
&current=us_aqi,pm2_5,pm10,ozone,nitrogen_dioxide\
&hourly=us_aqi,pm2_5&past_days=1&forecast_days=1\
&timeformat=unixtime&timezone=Asia%2FKolkata"
```

**What to check:**
- Response has a `current` block
- `current.us_aqi` is a number 0–500
- `current.pm2_5` is a number > 0 (Chennai typically 15–120 μg/m³)
- `current.time` is a unix timestamp

**Pass if:** `current.time` is present and `us_aqi` is a finite number.

## Known limitations to note

- Open-Meteo "current" values are **model grid estimates**, not readings from a ground sensor.
- CAMS grid resolution over India is ~45 km — all 5 Chennai zones share near-identical values.
- These values should be labelled `dataType: "model"` in all readings (already implemented).

## Result

| | Weather | Air quality |
|---|---|---|
| `current.time` present | Yes: 1793010600 (2026-10-26 16:00 IST) | Yes: 1793008800 (2026-10-26 15:30 IST) |
| Key metric value | temp = 28.8 °C | us_aqi = 154 |
| Pass / Fail | **Pass** | **Pass** |
| Notes | humidity 70%, feels-like 31.9 °C, precipitation 0.00, weather_code 3, wind 16.3 km/h. Update interval 900 s (15 min). Temperature is within the plausible 18–45 °C range. `hourly.time` length (48) not checked. | pm2_5 62.2 µg/m³ (within the typical 15–120 range), pm10 72.9, ozone 175.0, NO2 3.7. Update interval 3600 s (hourly model step). Values are CAMS model estimates, not sensor readings. |

Actual output (PowerShell, 2026-10-26):

```
$w.current
time                 : 1793010600
interval             : 900
temperature_2m       : 28.8
relative_humidity_2m : 70
apparent_temperature : 31.9
precipitation        : 0.00
weather_code         : 3
wind_speed_10m       : 16.3

$a.current
time             : 1793008800
interval         : 3600
us_aqi           : 154
pm2_5            : 62.2
pm10             : 72.9
ozone            : 175.0
nitrogen_dioxide : 3.7
```
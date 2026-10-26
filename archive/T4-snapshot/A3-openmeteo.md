# Evidence A3 — Open-Meteo Live Verification

**Item:** Confirm Open-Meteo Forecast and Air Quality APIs return valid current values for Chennai.

| Field | Value |
|---|---|
| Date & time | To be filled by T1 after live run |
| Run by | T1 — Data integration and reliability |
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
| `current.time` present | *(fill)* | *(fill)* |
| Key metric value | temp = *(fill)* °C | us_aqi = *(fill)* |
| Pass / Fail | *(fill)* | *(fill)* |
| Notes | | |

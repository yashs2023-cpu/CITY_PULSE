# CityPulse — Deployment & 24/7 Logging Guide (L1)

## 1. Host Recommendations

| Option | Cost | Ephemeral disk? | Notes |
|---|---|---|---|
| **Oracle Cloud Free Tier (ARM VM.A1)** | Free forever | **No** | 4 OCPU / 24 GB RAM; best free option. Persistent block storage. |
| **AWS EC2 t2.micro (Free Tier, 12 months)** | Free (year 1) | **No** (EBS) | After 12 months ~$8/mo. logs/ is on EBS, survives reboots. |
| **Railway / Render free tier** | Free | ⚠️ **YES** | Ephemeral filesystem. `logs/fetch-log.jsonl` is **lost on every deploy or sleep**. Do not use for 24/7 logging without mounting persistent storage. |
| **Fly.io free tier** | Free | ⚠️ **YES** | Needs a persistent Volume mounted at `/app/logs`. |
| **Spare machine / Raspberry Pi** | Hardware cost | **No** | Best for a lab demo; no internet exposure needed if accessed over LAN. |

> **Warning:** Any host marked "ephemeral disk" will lose `logs/fetch-log.jsonl` on restart unless you mount a persistent volume. For metrics collection you need a host with a persistent disk.

---

## 2. First-time Setup

```bash
# 1. Clone the repo
git clone https://github.com/yashs2023-cpu/CITY_PULSE.git
cd CITY_PULSE

# 2. Set up environment variables (never commit .env)
cp .env.example .env
nano .env          # fill in TOMTOM_API_KEY, ADMIN_USER, ADMIN_PASSWORD

# 3. Install dependencies
npm install --omit=dev

# 4. Verify tests pass
npm test
```

### Required `.env` values

| Variable | Required | Description |
|---|---|---|
| `TOMTOM_API_KEY` | Yes | Free key from https://developer.tomtom.com — enables Traffic Flow + Incidents |
| `PORT` | No (default 3000) | Dashboard server port |
| `TRAFFIC_CACHE_SECONDS` | No (default 120) | Server-side TomTom response cache |
| `ADMIN_USER` | Yes | Admin login username (authority server) |
| `ADMIN_PASSWORD` | Yes | Admin login password — must be set or login is refused |
| `ADMIN_PORT` | No (default 4000) | Authority server port |
| `VIEWER_USER` | No | Optional read-only viewer username |
| `VIEWER_PASSWORD` | No | Optional read-only viewer password |

---

## 3. Process Management with PM2

PM2 ensures both servers restart on crash and survive reboots.

```bash
# Install PM2 globally
npm install -g pm2

# Start both servers
pm2 start ecosystem.config.js

# Save process list (persists across reboots)
pm2 save

# Register PM2 as a system startup service
pm2 startup
# → Follow the printed command (sudo env PATH=... pm2 startup systemd ...)
```

### Useful PM2 commands

```bash
pm2 status                    # check both servers are online
pm2 logs citypulse-main       # live tail of main server logs
pm2 logs citypulse-admin      # live tail of admin server logs
pm2 restart citypulse-main    # restart one server
pm2 restart all               # restart both
pm2 monit                     # live CPU/RAM monitor
```

---

## 4. Log Filling Without a Browser

`server.js` includes a **server-side traffic poller** that runs automatically when started via `node server.js` or PM2. It calls `traffic()` every `TRAFFIC_CACHE_SECONDS` (default 120 s) and writes a log line with `origin: "server-poller"` to `logs/fetch-log.jsonl`.

- If `TOMTOM_API_KEY` is not set the poller logs one idle line and stops — it does not loop.
- Weather and air-quality are Open-Meteo (browser-direct, no key) — they are not polled server-side to avoid redundant model-grid calls; they are logged by the dashboard when a browser tab is open.
- `scripts/log-summary.js` reads all origins, so poller lines count toward the source totals.

---

## 5. Persistent Log Location

| Path | Owner | Contents |
|---|---|---|
| `logs/fetch-log.jsonl` | server.js | One JSON line per fetch event (traffic poller + dashboard reports) |
| `logs/pm2-main-out.log` | PM2 | stdout from citypulse-main |
| `logs/pm2-main-err.log` | PM2 | stderr from citypulse-main |
| `logs/pm2-admin-out.log` | PM2 | stdout from citypulse-admin |
| `logs/pm2-admin-err.log` | PM2 | stderr from citypulse-admin |
| `admin/data/db.json` | admin/server.js | Authority report database |

The `logs/` directory is in `.gitignore` (except `.gitkeep`). **Back up `logs/fetch-log.jsonl` and `admin/data/db.json` daily** — see Section 6.

---

## 6. Verification Checklist

After deploying and starting both servers, verify logging is working:

```bash
# 1. Check both servers respond
curl http://localhost:3000/api/health
# Expected: {"ok":true,"tomtomKeyConfigured":true}

curl http://localhost:4000/api/public/notices
# Expected: {"fetchedAt":...,"notices":[]}

# 2. Wait 2–3 minutes, then check the log file
cat logs/fetch-log.jsonl | head -5
# Expected: lines like {"at":"2026-...","source":"traffic","origin":"server-poller","ok":true,...}

# 3. Check line count is growing
wc -l logs/fetch-log.jsonl     # should increase every ~120s
```

Log line fields (existing contract — log-summary.js depends on these):

| Field | Type | Description |
|---|---|---|
| `at` | ISO string | Timestamp of the log write |
| `source` | string | `traffic`, `weather`, `airQuality`, `notices` |
| `origin` | string | `server`, `server-poller`, `dashboard` |
| `ok` | boolean | Whether the fetch succeeded |
| `ms` | number\|null | Round-trip time in milliseconds (dashboard origin only) |
| `error` | string\|null | Error message (truncated to 200 chars) |
| `readings` | array\|absent | Extended metric readings (L4 — T3 simulator validation) |

---

## 7. Backup

```bash
# Simple daily backup via cron (add to crontab -e)
# Runs at 02:00 every day, keeps the last 30 days
0 2 * * * cp /path/to/CITY_PULSE/logs/fetch-log.jsonl \
             /path/to/backups/fetch-log-$(date +\%Y\%m\%d).jsonl && \
           find /path/to/backups -name 'fetch-log-*.jsonl' -mtime +30 -delete

# Also back up the authority database
0 2 * * * cp /path/to/CITY_PULSE/admin/data/db.json \
             /path/to/backups/db-$(date +\%Y\%m\%d).json
```

---

## 8. Branch Protection (L2)

In GitHub → Repository Settings → Branches → Add rule for `main`:

- ✅ Require a pull request before merging
- ✅ Require status checks to pass (select the `test` CI job)
- ✅ Require branches to be up to date before merging
- ✅ Restrict who can push to matching branches → add only the Lead account
- ✅ Do not allow bypassing the above settings

This ensures every PR goes through CI (`npm test`) before the Lead merges.

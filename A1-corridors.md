# Evidence A1 — Corridor Verification

**Item:** TomTom Flow API — all 5 corridors return ok=true and matched positions are on the correct roads.

| Field | Value |
|---|---|
| Date & time | To be filled by T1 after live run |
| Run by | T1 — Data integration and reliability |
| URL | `http://localhost:3000/api/traffic` |
| Prerequisite | `TOMTOM_API_KEY` set in `.env`; `node server.js` running |

## Command

```bash
curl -s http://localhost:3000/api/traffic | node -e "
const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
d.corridors.forEach(c=>{
  const m=c.matched;
  console.log(c.name, c.ok?'OK':'FAIL', c.ok?'matched '+m.lat+','+m.lon:c.error);
});
console.log('Incidents ok:', d.incidents.ok);
"
```

On Windows (PowerShell):
```powershell
$d = Invoke-RestMethod http://localhost:3000/api/traffic
$d.corridors | ForEach-Object { "$($_.name)  ok=$($_.ok)  matched=$($_.matched.lat),$($_.matched.lon)" }
"Incidents ok: $($d.incidents.ok)"
```

## Expected result (pass criteria)

- Every corridor has `ok: true`
- `matched.lat` and `matched.lon` are within ~0.01° of the intended road (see config.json for intended coordinates)
- `incidents.ok: true` (or `false` only with a 429 rate-limit error, not a 400 field error)

## Intended vs matched positions (from config.json)

| Corridor | Intended lat | Intended lon | Notes |
|---|---|---|---|
| MG Road | 13.061 | 80.242 | Should snap to MG Road / Rajaji Salai area |
| Anna Salai | 13.044 | 80.2505 | Should snap to Anna Salai (Mount Road) |
| OMR | 12.901 | 80.2279 | Should snap to Old Mahabalipuram Road |
| ECR | 12.949 | 80.259 | Should snap to East Coast Road |
| GST Road | 13.007 | 80.22 | Should snap to Grand Southern Trunk Road (NH32) |

## Result

| Field | Value |
|---|---|
| Actual output | *(paste curl/PowerShell output here)* |
| Pass / Fail | *(fill after run)* |
| Notes / fixes | *(if any matched position looks wrong, note it here and update config.json)* |

## Zone-to-corridor links (A1 sub-check)

| Zone | Linked corridor | Assessment |
|---|---|---|
| MG Road | MG Road | ✓ linked |
| T. Nagar | Anna Salai | ✓ linked (nearest monitored road) |
| Anna Nagar | null | ✓ acceptable — no corridor passes through Anna Nagar; simulator uses city-wide mean |
| Velachery | OMR | ✓ linked |
| Adyar | null | ✓ acceptable — Adyar river area; ECR is the nearest but is ~4 km south. Leave null unless ECR matched position is verified to be on Sardar Patel Road / Lattice Bridge Road. |
| ECR | (not linked to any zone) | Consider linking to a new Sholinganallur zone if T1 adds one. |
| GST Road | (not linked to any zone) | Serves Pallavaram/Tambaram; out of current zone list. Acceptable. |

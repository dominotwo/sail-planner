# Sail Planner — Southern California Bight

A single-page sailing route planner for the Channel Islands and the Southern
California Bight. Distances threaded around land, sail time with a wind and
tacking model, marine chart layers, route comparison, and a day-by-day plan
with sun, moon and tide.

**Planning only — not for navigation.**

## What this repo is

No build step, no framework, no server, and no runtime dependency on a CDN.

| File | What it is |
| --- | --- |
| `index.html` | The whole app — markup, CSS and JS in one file (~240 KB) |
| `styles.css` | Design tokens (the Nocturne palette, type and spacing scales) |
| `config.js` | Optional overrides, e.g. your own MapTiler key |
| `vendor/` | Leaflet 1.9.4 and the Inter woff2 subsets, committed rather than fetched from a CDN — see `vendor/README.md` |

Everything else is fetched at runtime from public services (see *Data sources*).

## Run it locally

Open `index.html` in a browser, or serve the folder so `fetch` and tile
requests behave exactly as they will in production:

```bash
python3 -m http.server 8000     # then open http://localhost:8000
```

## Moving it to Claude Code

```bash
mkdir sail-planner && cd sail-planner
# copy index.html, styles.css, config.js, README.md, CLAUDE.md in here
git init && git add -A && git commit -m "Sail Planner: initial import"
claude
```

`CLAUDE.md` in this folder tells Claude Code how the file is organised and
which invariants to respect. A good first prompt:

> Read CLAUDE.md and index.html. Give me a map of the major sections and the
> global state shape, then wait — don't change anything yet.

Useful follow-ups:

- `Extract the CSS into styles/app.css and the JS into js/app.js, keeping behaviour identical.`
- `Add a "share plan" URL: encode the active route and plan into the location hash and restore it on load.`
- `Write a Playwright smoke test: load the page, drop two pins, open the plan, export CSV.`

## Hosting it publicly

It is a static site, so any static host works. Pick one:

**GitHub Pages** — free, versioned, slowest to update.

```bash
gh repo create sail-planner --public --source=. --push
# Settings → Pages → Source: Deploy from a branch → main / (root)
```
Lands at `https://<user>.github.io/sail-planner/`.

**Cloudflare Pages** — free, fast globally, instant rollbacks.

```bash
npx wrangler pages deploy . --project-name sail-planner
```

**Netlify**

```bash
npx netlify deploy --dir . --prod
```

**Vercel**

```bash
npx vercel --prod
```

No build command, no output directory — the repo root *is* the site.

### Custom domain

All four hosts take a CNAME to their edge; add the domain in the host's
dashboard, then add the same domain to the MapTiler allow-list below.

## Before you share the link

1. **Restrict the MapTiler key.** The key in `index.html` is visible to
   anyone who views source — that is unavoidable in a static site. In the
   MapTiler dashboard, add your deployed origin(s) to the key's allowed-origins
   list, or issue a new key for this site and put it in `config.js`.
   Watch the free tier's monthly tile quota once the link spreads.
2. **Check the other services' terms.** Esri's ArcGIS tile endpoints
   (seafloor relief and imagery) and Nominatim (the anchorage search) are used
   directly from the browser. Nominatim's usage policy expects a low request
   rate and identifiable traffic; if the site gets real use, cache results or
   move the search behind your own endpoint.
3. **Keep the disclaimer visible.** "Planning only — not for navigation"
   appears in the map attribution and in the About panel. Do not remove it.
4. **Nothing is stored server-side.** Locations, routes and plans live in the
   visitor's `localStorage` (`sailplanner.v4`). Every visitor starts from the
   built-in set of anchorages; nobody can see anyone else's work, and there is
   currently no way to share a plan by URL — plans travel as GPX, CSV or ICS
   downloads.
5. **No analytics, no cookies, no accounts, and no third-party asset on the
   critical path.** Leaflet and Inter are vendored under `vendor/`, so nothing
   a visitor needs to see the page is fetched from anyone else and no visitor
   IP reaches Google. The map tiles and marine data are still fetched from the
   services in *Data sources* below, at the moment a layer is switched on.

## Data sources

| Layer | Source |
| --- | --- |
| Land, roads, topo, isobaths | MapTiler (key required) |
| Seafloor relief, imagery | Esri Ocean / World Imagery, GEBCO, NOAA |
| Aids to navigation | NOAA/USCG hosted ATON feature service |
| Hazards (wrecks, rocks, obstructions) | NOAA ENC Direct |
| Protected areas | CDFW marine protected areas |
| Traffic lanes, precautionary area | 33 CFR 167.501 coordinates, in-file |
| Tide predictions | NOAA CO-OPS |
| Elevation / depth soundings | AWS terrarium elevation tiles |
| Anchorages | USGS GNIS, plus Nominatim search on demand |

Attribution for each layer is printed in the map's attribution control as the
layer is switched on.

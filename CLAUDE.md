# CLAUDE.md — Sail Planner

## What this is
A single-file browser app: `index.html` holds the markup, one `<style>` block
and one `<script>`. `styles.css` carries design tokens only. No build step, no
package manager, no framework. Leaflet 1.9.4 loads from unpkg with an SRI hash.

## Ground rules
- **Keep it a static site.** No server, no bundler, no npm dependencies unless
  the user asks. Anything new must work by opening the file over http.
- **Never hard-code a colour, size or spacing value.** Everything comes from the
  CSS variables in `styles.css` and the palette blocks at the top of the
  `<style>` in `index.html` (`:root`, `[data-pal="day"]`, `[data-pal="night"]`).
  Text below 11px is a bug — the smallest step in use is 10px for uppercase
  micro-labels and 11px for everything else.
- **Three palettes must all work.** Any new UI has to be checked in Day, Dusk
  and Night; Dusk is the default. Palette is `data-pal` on `<html>`.
- **Don't touch the geometry or the models without being asked.** The
  land-avoidance routing, the 42° beat / gybing-angle sail-time model, the
  twilight and moon-phase maths, and the CFR traffic-zone coordinates are all
  verified against real sources.
- **State lives in one object.** `S` is the whole app state; `save()` writes it
  to `localStorage` under `sailplanner.v4`. Bump the key if the shape changes
  incompatibly, and migrate rather than discard.

## Layout of index.html
1. `<head>` — meta, fonts, tokens stylesheet, Leaflet, then the app's `<style>`.
2. `<style>` — palettes first, then chrome (sidebar, drawers, floats), then the
   map overlays, then the plan panel.
3. SVG filter defs — the chart transforms that key out OSM's sea blue and tone
   tiles per palette.
4. Markup — `#rail`, `#side` (locations, routes, legend), `#map`, `#ctrls`
   (Conditions), `#mxFloat` (matrix), `#drawer` (compare), `#planDock` (plan).
5. `<script>` — data and geometry, then map layers, then the render functions,
   then exports (GPX, CSV, ICS), then boot.

## The render chain
The top-level render is `all()`, not `renderAll`. It calls `sidebar()` and
`draw()`; `draw()` tail-calls `matrix()`, which tail-calls `compare()`.
`renderPlan()` is called separately from `all()`, and only when `S.planOpen`.
So: `all()` → `sidebar()` + `draw()` → `matrix()` → `compare()`, plus
`renderPlan()`. Anything that changes state ends with `all()`, which also
`save()`s.

## Keys and services
`MT_KEY` (MapTiler) is public by necessity; restrict it by domain in the
MapTiler dashboard and override it via `window.SAIL_CONFIG.maptilerKey` in
`config.js`. Never add a service that needs a *secret* key without introducing
a server-side proxy first.

## When you change the plan panel
The day bar is a fixed 24-hour scale: x = hour/24. The axis (`.pscale`), the
day bars, the leg blocks and the tide curve all share that mapping — change one
and change all four.

# CLAUDE.md — Sail Planner

## What this is
A single-file browser app: `index.html` holds the markup, one `<style>` block
and one `<script>`. `styles.css` carries design tokens only. No build step, no
package manager, no framework. Leaflet 1.9.4 and Inter are **vendored** under
`vendor/` — every render-critical asset is same-origin, so the page boots with no
internet at all. See `vendor/README.md` before touching either.

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

## Responsive: three gates, and where the rules go
Media queries add no specificity, so **every responsive block lives at the end
of the sheet**, after the rules it overrides. Four blocks sat mid-sheet once and
were simply dead.

| Gate | Means | Holds |
|---|---|---|
| `(max-width:720px)` | narrow, mouse or finger | phone layout: one surface at a time, docks, `.rleg`/`.pleg` templates |
| `(hover:none)` | any touch device incl. tablet | actions that hover used to reveal, 16px text fields, pressed states |
| `(hover:none) and (max-width:720px)` | a phone | the 44px minimum targets (M3) |

The third is deliberately narrower than the second. A tablet keeps the dense
desktop grids — `.pcols`, `.pleg` and `.pdep` hold controls in 12/16/20px
tracks, and a 44px minimum walks them out of those tracks.

## Tokens this app adds
`styles.css` is the design system. These are app-shell tokens, defined in
`index.html`'s own `:root`:

- `--safe-t/r/b/l` — `env(safe-area-inset-*)` with a `0px` fallback, so every
  `calc()` is a no-op on a device without insets.
- `--rail` / `--rail-edge` — the collapsed sidebar's width, and that plus the
  left inset. **Five rules are pinned to it**: the grid template at both widths,
  the peek panel, the filter probe, and the matrix float. They were five
  separate literals; change the token, not the literals. `--rail` is 42px, 48px
  on a phone (a 44px button with 2px either side).
- `--tap` — 44px, the touch minimum and what the audit script checks.

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

## Docks
**There are three**: compare, plan, and — below 720px only — the matrix. Above
that width the matrix is a floating window inside `.map-wrap` and is *not* a
dock; `mxHome()` moves the same element into `.stage` when the breakpoint is
crossed, so nothing is duplicated and `#mxWrap` is never re-rendered.

Everything is written over `openDocks()` rather than naming two of them:
`dockOpen/dockHead/dockBody/dockPane/dockSize/dockBtn` take a key of
`'cmp' | 'plan' | 'mx'`. Add a fourth and these are the only accessors to touch.

**Below 720px exactly one is open.** `closeOtherDocks(keep)` does it by state
and button, not by calling the other setters — those call back into it.

**Three ceilings, and they must agree or a drag springs back on release.**
`defaultBody()` is how far a dock nobody has touched may grow: a share of the
stage, capped on a phone so the chart keeps 45% of it. `availBody(self)` is how
far a *deliberately* sized dock may go — bounded only by `MIN_CHART` and by what
the others are using; if this dock has an explicit size the others yield to
their minimum. `S.ph` / `S.dh` / `S.mh` hold the explicit sizes and being
non-null is what marks a dock as deliberately sized, so anything that sets a
size must set it *before* calling `availBody`. Both drag handlers and
`fitToContent()` clamp with `availBody`, the same ceiling `fitDocks()` re-applies
on release. `fitDocks()` fits all three, because `availBody` is a function of
all of them.

Header heights are **measured**, not assumed to be 40px — a phone dock header is
~63px once its controls are finger-sized, and the estimate is what put the chart
at 43% against a 45% floor.

Closing a dock is `display:none`, which does not keep a scroll position.
`rememberScroll`/`restoreScroll` carry it, synchronously with a forced reflow —
not in `requestAnimationFrame`, which runs before layout, so the pane has no
scroll range yet and the assignment writes 0.

## When you change the plan panel
The day bar is a fixed 24-hour scale: x = hour/24. The axis (`.pscale`), the
day bars, the leg blocks and the tide curve all share that mapping — change one
and change all four.

A day's first leg departs at `DAY_START` (09:00) unless that leg has a time of
its own in `p.dep[i]`. It is a constant, not state — it used to be a "Days
start" field in the plan header and a `S.depTime` key. Per-leg departures are
untouched by this: tap a departure or drag the leg on the day bar.

## Traps this file has already sprung
Each of these cost a debugging round. They are all still live.

- **Hiding a grid child shifts every later sibling one track left**, and a child
  bigger than its track overflows the row by exactly the difference. `.rleg`,
  `.pleg`, `.pdep` and `.pcols` all carry hand-tuned templates. **Change the
  child, change the template.** Bitten three times: `.grip` restored without
  updating `.rleg`; a 44px `.pstep` in `.pdep`'s 16px track; a 44px `.rdel` in
  `.rleg`'s 18px track.
- **The spacing ramp has holes.** 1, 2, 3, 4, 6, 8 exist; `--space-5` and
  `--space-7` do not, and referencing one silently drops the declaration and
  takes the initial value. Grep before you use.
- **`::before` / `::after` do not render on `<input>`** — it is a replaced
  element. A pseudo-element hit area on a checkbox never worked; grow the box or
  let its `<label>` be the target.
- **The child combinator does not reach through `display:contents`.** It removes
  the wrapper's *box*, not the wrapper, so `.rleg > .rleg-meta` matches nothing.
  Use a descendant selector.
- **HTML5 drag does fire on iOS via long-press.** Two passes hid the grips on
  the opposite premise. Reordering a stop or a plan leg by drag works on a
  phone; the arrows are hidden below 720px and `.rnote` says so.
- **Headless Chrome reports `(hover:none)` true and `(pointer:coarse)` false**,
  with `maxTouchPoints:0`. So it renders touch variants at desktop widths — a
  false "desktop regression" — and cannot exercise a `pointer:coarse` gate at
  all. Neutralise `(hover:none)` blocks when doing desktop comparisons.
- **Set a dock's explicit size before calling `availBody`.** A non-null
  `S.ph`/`S.dh` is what marks a dock deliberately sized, and that changes the
  other dock's ceiling.
- **Night's chart-semantic exceptions stay.** The green "better" delta, the
  cool-grey moon limb and the amber daylight band are settled — don't red-shift
  them for consistency.

## Known issues, deliberately not fixed

These were found in a full review on 2026-08-23 and consciously deferred. Read
before "discovering" any of them again.

- **The daylight band vanishes for visitors far from Pacific time.** `band()`
  (in `renderPlan`) takes a from/to pair; when local sunrise and sunset straddle
  local midnight — which happens when the device clock is many hours off SoCal —
  `from > to` and it renders nothing, so the whole 24-hour bar reads as night.
  The fix is to split a wrapped span into two bands. Left alone because the
  audience is local; it is a rendering bug, not the twilight maths.
- **Nominatim is called harder than its policy allows.** `anchFetch` issues five
  sequential queries 120 ms apart (~8 req/s against a documented 1 req/s), with
  no `email=` parameter and no settable `User-Agent`, so `Referer` is the only
  identification. Gated behind the Anchorages layer, which is off by default.
  Raise the sleep to ~1100 ms, persist `anchCache`, or proxy it before the link
  spreads. A block lands on the whole origin, not one user.
- **`bottomRefresh` has no debounce and bypasses its own tile budget.** Its
  second `elevLoad` passes an explicit zoom, so the 999-tile cap is never
  consulted; zoomed out, one pan can request thousands of PNGs from a
  public-good S3 bucket. Gated behind the Bottom layer, off by default.
- **Six destructive actions have no confirmation and no undo** — route delete,
  location delete, `clear`, the plan's remove-day, and unticking a location
  (which silently strips it from saved routes). `save()` runs on every `all()`,
  so nothing is recoverable. Hidden below 720px, but live on desktop. Location
  delete and route clear now ask; the rest do not.
- **The locations list is the one row that is not finger-sized.** It is 289px
  with four adjacent controls plus the name, and four 44px targets leave the
  name 83px, at which "Santa Barbara Island" wraps to three lines. It needs the
  detail-sheet restructure (M8) before it can carry the targets, so it is left
  at its old sizes rather than made worse.
- **Every network failure is silent.** Tides, ENC hazards and restricted areas,
  CDFW protected areas, ATON navaids, Nominatim and the elevation tiles all
  catch their errors and render nothing. There is no `tileerror` handler and no
  `<noscript>`.
- **Navaids draw nothing below zoom 9** with no explanation. There is a dead
  `.zhint` CSS class that was evidently built for exactly this message.
- **No `og:image`**, so a shared link previews as a bare text card.
- **The design system has drift the review catalogued but did not fix**: 15
  distinct font sizes where 6 would do, two checkbox implementations, two close
  buttons, four icon-button treatments, and ~45 hard-coded 1–6px paddings
  running a second spacing scale beside the token ramp.
- **The spacing ramp has holes: it defines 1, 2, 3, 4, 6, 8 — there is no
  `--space-5` or `--space-7`.** Referencing one is not an error you will see;
  the declaration is simply dropped and the property falls back to its initial
  value, so `margin:var(--space-5) 0` silently becomes `margin:0`. That has
  already caused one layout bug. Every reference in the file currently resolves
  — check with:
  `grep -ohE 'var\(--space-[0-9]+' index.html styles.css | sort -u`

Settled design decisions, so don't re-litigate them:

- **Night keeps its chart-semantic exceptions.** The compare drawer's green
  "better" delta, the cool-grey moon limb and the amber daylight band stay as
  they are, even though the palette is otherwise red-shifted for dark
  adaptation. Green-means-better reads faster than encoding it by value.
- **Below 720px the app is a viewer.** Tapping pins and the add-a-point select
  both work on touch and stay; everything depending on a hover reveal, an HTML5
  drag, or a sub-20px target is hidden rather than left to fail silently.

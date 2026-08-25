# dev/

Not part of the site. Nothing here is linked from `index.html`, and nothing here
is needed to run it.

## `webkit-filter-probe.html`

Answers one question: **does this browser apply `filter: url(#id)` to a
*composited* element?**

The chart depends on it — the water is keyed out of the land tiles that way and
the palettes are toned that way — and WebKit bars reference filters from the
CoreAnimation compositor, which is why the per-tile
`@supports (-webkit-touch-callout: none)` block at the end of `index.html`'s
stylesheet exists.

Standalone: no Leaflet, no app, so it cannot rot with the code it is testing.
Open it on the device (`/dev/webkit-filter-probe.html`) if the chart ever stops
toning on iOS after a Safari release.

This used to be `?ft=1` inside `index.html`. It came out because it was the only
part of that page addressed to a developer rather than a sailor, and it shipped
to everyone to sit there hidden.

## `centring-audit.js`

Are the marks inside the buttons actually centred? Run it per surface
(`#side #dock #cmp #mx #ctrls`) at both widths.

It judges **SVG content only**, deliberately.
`Range.getBoundingClientRect()` measures the font's ascent/descent box rather
than glyph ink, and Inter's ascent is bigger than its descent — so text that
flexbox centres perfectly reports a ~1.8px offset every time, in every button,
including plain words like "fit". That is typography, not a defect, and a check
that cries wolf is a check nobody keeps running. An SVG has no such excuse.

For text it asserts the *layout* instead: an icon-sized button has to use a
centring display. Cheap, and it catches the real class of bug.

The bug it was written for: a bare `<button>` carries the UA's `1px 6px`
padding, so a 13px icon was centring inside an 8px content box and sitting
2.5px off. A text glyph never showed it; an SVG did.

## `og-capture.js`

The setup script that produced `og.png`, the link-preview card. Injected before
`</body>` into a copy of `index.html`, then screenshotted at 1200×630:

```sh
# from a copy of index.html with this script appended, served over http
docker run --rm --network host -v "$PWD:/out" zenika/alpine-chrome \
  --no-sandbox --headless --disable-gpu --hide-scrollbars \
  --window-size=1200,630 --force-device-scale-factor=1 \
  --virtual-time-budget=15000 --screenshot=/out/og.png <url>
```

It forces Dusk, collapses the sidebar and Conditions, and fits the chart to the
sample passage. Regenerate `og.png` this way if the chart's look changes.

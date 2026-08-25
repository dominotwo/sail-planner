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

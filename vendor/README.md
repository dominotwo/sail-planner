# vendor/

Third-party assets, committed rather than loaded from a CDN.

## Why

The page previously made three render-blocking cross-origin requests before it
could paint: `leaflet.css` and `leaflet.js` from unpkg, and a stylesheet from
Google Fonts. Measured from the host itself, on good internet, those cost 255 ms,
262 ms and 228 ms. On a phone they cost more, and they fail independently — and
if `leaflet.js` in particular never arrives, the app's `<script>` throws at
`L.map()` and the visitor gets a page of empty chrome with no error.

Vendoring makes every render-critical asset same-origin. The page now works with
no internet at all (the chart tiles won't load, but the app boots, the route
draws and the plan computes), and no visitor IP reaches Google.

## What's here

| Path | Upstream | Version |
|---|---|---|
| `leaflet/leaflet.js` | `https://unpkg.com/leaflet@1.9.4/dist/leaflet.js` | 1.9.4 |
| `leaflet/leaflet.css` | `https://unpkg.com/leaflet@1.9.4/dist/leaflet.css` | 1.9.4 |
| `leaflet/images/*.png` | `https://unpkg.com/leaflet@1.9.4/dist/images/` | 1.9.4 |
| `inter/inter-latin.woff2` | Google Fonts, `Inter:wght@400..600`, latin subset | variable |
| `inter/inter-latin-ext.woff2` | same, latin-ext subset | variable |
| `inter/inter.css` | generated from Google's CSS, `src` rewritten to relative paths | — |

Both Leaflet files were verified byte-exact against upstream's published
SHA-384 hashes at the moment they were vendored:

```
leaflet.js   sha384-cxOPjt7s7Iz04uaHJceBmS+qpjv2JkIHNVcuOrM+YHwZOmJGBXI00mdUXEq65HTH
leaflet.css  sha384-sHL9NAb7lN7rfvG5lfHpm643Xkcjzp4jFvuavGOndn6pjVqS6ny56CAt3nsEVT4H
```

Re-check either at any time with:

```bash
openssl dgst -sha384 -binary vendor/leaflet/leaflet.js | openssl base64 -A
```

## Notes

- **No `integrity` attribute on the tags in `index.html`, on purpose.** SRI
  guards against a CDN serving something other than what you asked for. That
  cannot happen for a file shipped in the repo, and the attribute would then
  have to be updated by hand on every refresh — a footgun with no upside.
- **The Leaflet PNGs are almost certainly unused.** The app builds every marker
  with `L.divIcon` and never calls `L.icon` or `L.control.layers`, so nothing
  should request them. They are 6.5 KB in total and are here so that a future
  change which does use a default marker doesn't silently 404.
- **Only two of Google's seven subsets are vendored.** Inter is served as one
  variable woff2 per script; `cyrillic`, `cyrillic-ext`, `greek`, `greek-ext`
  and `vietnamese` are not fetched. `latin-ext` is kept because Spanish place
  names along this coast need it.
- **One file covers weights 400–600 continuously**, so this replaced three
  static weights with two downloads. The app uses 400, 500 and 600.
- Glyphs outside Inter's coverage — the arrows and operators in the UI, `⇅ ↧ ⊕`
  — already fell back to a system font when the font came from Google. That
  behaviour is unchanged.

## Refreshing

Leaflet:

```bash
V=1.9.4
for f in leaflet.js leaflet.css; do curl -sSL -o vendor/leaflet/$f https://unpkg.com/leaflet@$V/dist/$f; done
```

Then verify the hashes against the ones unpkg publishes and update the table
above.

Inter: fetch `https://fonts.googleapis.com/css2?family=Inter:wght@400..600&display=swap`
with a **modern browser User-Agent** — the endpoint serves different CSS to
different clients, which is the reason it can't be pinned — keep the `latin` and
`latin-ext` blocks, download the woff2 each one names, and rewrite `src` to the
relative filename.

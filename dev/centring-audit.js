/* Are the marks inside the buttons actually centred?
 *
 * Inject before </body> in a copy of index.html, load it, read document.title.
 * Set the surface with a hash: #side #dock #cmp #mx #ctrls
 *
 * It judges SVG content only, and that is the point. Range.getBoundingClientRect
 * measures the FONT's ascent/descent box, not glyph ink, and Inter's ascent is
 * larger than its descent — so text centred perfectly well by flexbox reports a
 * ~1.8px offset every single time, in every button, including plain words. That
 * is typography, not a defect, and a check that flags it is a check nobody will
 * keep running. An SVG has no such excuse: its box is its box, and if it is not
 * centred something is wrong. The bug this was written for was exactly that —
 * a bare <button> carries the UA's 1px 6px padding, so a 13px icon was centring
 * inside an 8px content box and sitting 2.5px off.
 *
 * For text, the check is structural instead: an icon-sized button must use a
 * centring layout. That is asserted here too, and it is cheap.
 */
const WHERE = (location.hash || '#side').slice(1);
setTimeout(() => {
  const R = e => e.getBoundingClientRect(), out = [], bad = [], nolayout = [];
  const w = document.getElementById('welcome'); if (w) w.dataset.on = 'false';
  S.collapsed = (WHERE !== 'side'); S.ctrls = true; all();
  if (WHERE === 'dock') { S.tides = false; setPlan(true); }
  if (WHERE === 'cmp') setCompare(true);
  if (WHERE === 'mx') setMatrix(true);
  setTimeout(() => {
    document.querySelectorAll('button').forEach(el => {
      const b = R(el);
      if (b.width < 6 || b.height < 6) return;
      if (getComputedStyle(el).display === 'none') return;
      const iconish = b.width < 52 && Math.abs(b.width - b.height) < 12;
      if (!iconish) return;
      const nm = ((el.className || '') + '').split(' ').slice(0, 2).join('.') || el.id;

      const svg = el.querySelector('svg');
      if (svg && R(svg).width > 1) {
        const s = R(svg);
        const L = s.left - b.left, Rr = b.right - s.right;
        const T = s.top - b.top, B = b.bottom - s.bottom;
        if (Math.abs(L - Rr) > 1.5 || Math.abs(T - B) > 1.5)
          bad.push(nm + ' ' + Math.round(b.width) + 'x' + Math.round(b.height) +
                   ' L/R=' + L.toFixed(1) + '/' + Rr.toFixed(1) +
                   ' T/B=' + T.toFixed(1) + '/' + B.toFixed(1));
        return;
      }
      // text: assert the layout centres it, since the ink cannot be measured fairly
      const cs = getComputedStyle(el);
      /* Three ways to be centred, and all of them count. Grid uses
         justify-ITEMS (place-items sets that, not justify-content), and a
         plain block <button> centres its text by UA default — asking those
         for justify-content is asking the wrong property. */
      const across = /center/.test(cs.justifyContent) || /center/.test(cs.justifyItems) ||
                     /center/.test(cs.textAlign);
      const down   = /center/.test(cs.alignItems) || !/flex|grid/.test(cs.display);
      const centred = across && down;
      if (!centred) nolayout.push(nm + ' display=' + cs.display +
                                  ' align=' + cs.alignItems + ' justify=' + cs.justifyContent);
    });
    out.push(WHERE + ': SVG off-centre=' + bad.length + '  text-without-centring-layout=' + nolayout.length);
    [...new Set(bad)].slice(0, 8).forEach(x => out.push('  OFFSET ' + x));
    [...new Set(nolayout)].slice(0, 8).forEach(x => out.push('  LAYOUT ' + x));
    document.title = out.join(' ||| ');
  }, 1400);
}, 1500);

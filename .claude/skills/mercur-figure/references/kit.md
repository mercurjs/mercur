# Kit API

A figure is a module:

```js
export default {
  name: "order-split",          // kebab-case; output file stem
  width: 1040,                  // viewBox width; keep 1040
  height: 610,                  // tighten after the first look
  alt: "One sentence that says what the figure shows.",
  draw(f) { /* f is a Figure */ },
}
```

`draw` runs once per theme. Never branch on the theme; tokens do that.

## Tones

Every colour is a tone: `hi` `text` `mid` `lo` (greys, strongest to faintest),
`green` `amber` `red` (status), `violet` (the accent). Structural colours
(`plate`, `line`, `rule`, `wire`, `tagBg`) are applied by the primitives; read
them as `f.t.rule` only when passing a stroke to `line`.

## Figure (canvas)

| Call | Draws |
| --- | --- |
| `f.tiles({ seed, size = 88, density = .28, clear = [] })` | background tiles; they always paint first, so call last with the real wire corridors in `clear` |
| `f.panel({ x, y, w, h?, shadow = true, name }, (p) => …)` | an opaque, clipped, shadowed plate; `p` has origin at the panel's top-left. Omit `h` and return the bottom y from the callback to size it to content. Returns `{ x, y, w, h }`. |
| `f.cascade({ x, y, w, h, dx = -60, dy = 86 }, [draw, …])` | panels back → front; the last is the front one at `(x, y)`, each earlier one `-dx` right and `dy` up |
| `f.wire([[x, y], …], { end = true, dash })` | orthogonal connector ending in a square |

## Layer (inside a panel, also on `f`)

| Call | Returns | Draws |
| --- | --- | --- |
| `p.header({ h = 76, marker, title, tabs, active = 0, toggle: { on, label, tone }, note, pad = 24 })` | h | title bar: marker, title, divider, tabs with the active bar, a toggle or a faint note on the right, bottom border |
| `p.table({ y, columns: [{ label, w, align }], rows, rowH = 64, headH = 54, pad = 32 })` | bottom y | caps column heads and rows; columns should sum to `p.w - 2 * pad` |
| `p.tags(x, y, w, items)` | bottom y | wrapping row of tags; items are strings or `{ tag, dashed }` |
| `p.label(x, mid, str, { size, tone, weight, anchor, caps })` | width | text vertically centred on `mid` |
| `p.text(x, baseline, str, opts)` | width | text on a baseline |
| `p.marker(x, mid, tone, size = 10)` | size | square marker |
| `p.tag(x, mid, str, { dashed })` | width | grey (or dashed = "yours to add") pill |
| `p.chip(x, mid, str, tone, { align })` | width | status: square marker + caps label on grey |
| `p.toggle(x, mid, on, tone = "green")` | 46 | square switch |
| `p.caret(x, mid, open)` | 10 | ▾ / ▸ for expandable rows |
| `p.line(x1, y1, x2, y2, { stroke, dash })` | | a 1px line |
| `p.rect(x, y, w, h, { fill, stroke, dash })` | | a raw rect — prefer the primitives above |

## Table cells

A row is an array of cells, or `{ accent: true, cells }` for the one accented
row (violet bar on the left). A cell is:

| Cell | Renders |
| --- | --- |
| `"text"` | body text, `hi` |
| `{ text, tone }` | body text in a tone (`mid` for secondary numbers, `text` for paths) |
| `{ indent: 32, text }` | a child row's first cell |
| `{ caret: true \| false, text }` | an expandable group row |
| `{ marker: tone, text }` | marker then text |
| `{ tag, dashed }` | a pill |
| `{ chip, tone }` | a status chip |
| `{ toggle: bool, tone }` | a switch |

`align: "right"` on a column right-aligns text, chips and toggles (use it for
money and for the last column of back panels, so their cropped tail shows).

## Measuring

Everything is monospace: a string is `length × size × 0.6` wide (`measure` in
`kit.mjs`; caps add 1.2 per character). Lay out with arithmetic, not guesses —
and let `build.mjs` warn you about overflow.

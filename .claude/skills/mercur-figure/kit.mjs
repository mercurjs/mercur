// Drawing kit for Mercur docs figures. Figures call into a Figure; they never
// write SVG, colours or font sizes of their own.

export const FONT =
  "JetBrains Mono, SF Mono, SFMono-Regular, Menlo, Consolas, Liberation Mono, monospace"

export const SIZE = { title: 18, tab: 17, body: 16, cell: 15, caps: 14 }
const CAPS_TRACK = 1.2
export const MIN_TEXT = 14

export const THEMES = {
  light: {
    plate: "#ffffff",
    line: "#e4e4e7",
    rule: "#ededf0",
    wire: "#c4c4cc",
    hi: "#18181b",
    text: "#3f3f46",
    mid: "#71717a",
    lo: "#a1a1aa",
    tile: "#ececef",
    dot: "#d9d9de",
    grain: "#e4e4e7",
    tagBg: "#f4f4f5",
    toggleOff: "#d4d4d8",
    shadow: "#18181b",
    shadowOpacity: 0.07,
    grainOpacity: 0.22,
    green: "#3f7d3a",
    red: "#b3361f",
    amber: "#c2680c",
    violet: "#7c3aed",
  },
  dark: {
    plate: "#15121d",
    line: "#2b2636",
    rule: "#221e2b",
    wire: "#3d3749",
    hi: "#f4f4f5",
    text: "#d4d4d8",
    mid: "#a1a1aa",
    lo: "#71717a",
    tile: "#1d1926",
    dot: "#2c2737",
    grain: "#1d1926",
    tagBg: "#1f1b29",
    toggleOff: "#3f3a4b",
    shadow: "#000000",
    shadowOpacity: 0.55,
    grainOpacity: 0.35,
    green: "#6fbf68",
    red: "#f0735a",
    amber: "#f2a14b",
    violet: "#a78bfa",
  },
}

const TONES = ["hi", "text", "mid", "lo", "green", "red", "amber", "violet"]

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

export const measure = (s, size = SIZE.body, track = 0) =>
  String(s).length * (size * 0.6 + track)

const r1 = (n) => Math.round(n * 10) / 10

function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

class Layer {
  constructor(fig, w, h, where) {
    this.fig = fig
    this.t = fig.t
    this.w = w
    this.h = h
    this.where = where
    this.out = []
  }

  color(tone) {
    if (!TONES.includes(tone)) throw new Error(`unknown tone "${tone}"`)
    if (tone === "violet") this.fig.stats.accent++
    return this.t[tone]
  }

  rect(x, y, w, h, { fill = "none", stroke, dash } = {}) {
    const s = stroke ? ` stroke="${stroke}" stroke-width="1"` : ""
    const d = dash ? ` stroke-dasharray="${dash}"` : ""
    this.out.push(
      `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" fill="${fill}"${s}${d}/>`
    )
  }

  line(x1, y1, x2, y2, { stroke = this.t.line, dash } = {}) {
    const d = dash ? ` stroke-dasharray="${dash}"` : ""
    this.out.push(
      `<line x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}" stroke="${stroke}" stroke-width="1"${d}/>`
    )
  }

  text(x, y, str, { size = SIZE.body, tone = "text", weight, anchor, caps } = {}) {
    if (size < MIN_TEXT) this.fig.warn(`text "${str}" is ${size}px, below ${MIN_TEXT}`)
    const s = caps ? String(str).toUpperCase() : String(str)
    const attrs = [
      `x="${r1(x)}"`,
      `y="${r1(y)}"`,
      `font-size="${size}"`,
      `fill="${this.color(tone)}"`,
    ]
    if (caps) attrs.push(`letter-spacing="${CAPS_TRACK}"`)
    if (weight) attrs.push(`font-weight="${weight}"`)
    if (anchor) attrs.push(`text-anchor="${anchor}"`)
    this.out.push(`<text ${attrs.join(" ")}>${esc(s)}</text>`)
    return measure(s, size, caps ? CAPS_TRACK : 0)
  }

  // Text vertically centred on `mid`.
  label(x, mid, str, opts = {}) {
    const size = opts.size ?? SIZE.body
    return this.text(x, mid + size * 0.35, str, opts)
  }

  marker(x, mid, tone, size = 10) {
    this.rect(x, mid - size / 2, size, size, { fill: this.color(tone) })
    return size
  }

  tag(x, mid, str, { dashed = false, tone = "mid", size = SIZE.cell } = {}) {
    const w = measure(str, size) + 24
    const h = 30
    if (dashed) this.rect(x + 0.5, mid - h / 2 + 0.5, w - 1, h - 1, { stroke: this.t.wire, dash: "3 3" })
    else this.rect(x, mid - h / 2, w, h, { fill: this.t.tagBg })
    this.label(x + 12, mid, str, { size, tone })
    return w
  }

  chip(x, mid, str, tone, { align = "left" } = {}) {
    const w = 12 + 10 + 10 + measure(str.toUpperCase(), SIZE.caps, CAPS_TRACK) + 12
    const x0 = align === "right" ? x - w : x
    this.rect(x0, mid - 16, w, 32, { fill: this.t.tagBg })
    this.marker(x0 + 12, mid, tone)
    this.label(x0 + 34, mid, str, { size: SIZE.caps, tone: "text", caps: true })
    return w
  }

  toggle(x, mid, on, tone = "green") {
    this.rect(x, mid - 11, 46, 22, { fill: on ? this.color(tone) : this.t.toggleOff })
    this.rect(on ? x + 24 : x + 3, mid - 8, 19, 16, { fill: this.t.plate })
    return 46
  }

  caret(x, mid, open, tone = "text") {
    const c = this.color(tone)
    const pts = open
      ? `${x},${mid - 3.5} ${x + 10},${mid - 3.5} ${x + 5},${mid + 3.5}`
      : `${x + 2},${mid - 5} ${x + 9},${mid} ${x + 2},${mid + 5}`
    this.out.push(`<polygon points="${pts}" fill="${c}"/>`)
    return 10
  }

  // A panel's title bar: marker, title, divider, tabs, and one control on the right.
  header({ h = 76, marker, title, tabs = [], active = 0, toggle, note, pad = 24 }) {
    const mid = h / 2
    let x = pad
    if (marker) x += this.marker(x, mid, marker) + 12
    x += this.label(x, mid, title, { size: SIZE.title, tone: "hi", weight: 500 })
    if (tabs.length) {
      x += 24
      this.line(x, mid - 18, x, mid + 18)
      x += 32
      tabs.forEach((tab, i) => {
        const on = i === active
        const tw = this.label(x, mid, tab, { size: SIZE.tab, tone: on ? "hi" : "mid" })
        if (on) this.rect(x - 18, h - 3, tw + 36, 3, { fill: this.t.hi })
        x += tw + 40
      })
    }
    if (toggle) {
      const lw = measure(toggle.label, SIZE.cell)
      const lx = this.w - pad - lw
      this.label(lx, mid, toggle.label, { size: SIZE.cell, tone: "text" })
      this.toggle(lx - 14 - 46, mid, toggle.on, toggle.tone)
    } else if (note) {
      this.label(this.w - pad, mid, note, { size: SIZE.cell, tone: "lo", anchor: "end" })
    }
    this.line(0, h, this.w, h)
    return h
  }

  cell(x, mid, colW, spec, align) {
    if (spec == null || spec === "") return
    const s = typeof spec === "string" ? { text: spec } : spec
    let used = 0
    let cx = x
    if (s.indent) cx += s.indent
    if (s.caret !== undefined) {
      this.caret(cx, mid, s.caret)
      cx += 22
    }
    if (s.marker) cx += this.marker(cx, mid, s.marker) + 12
    if (s.chip) {
      used = this.chip(align === "right" ? x + colW : cx, mid, s.chip, s.tone ?? "green", { align })
    } else if (s.tag) {
      used = this.tag(cx, mid, s.tag, { dashed: s.dashed })
    } else if (s.toggle !== undefined) {
      used = this.toggle(align === "right" ? x + colW - 46 : cx, mid, s.toggle, s.tone)
    } else if (s.text !== undefined) {
      const opts = { size: SIZE.body, tone: s.tone ?? "hi" }
      used =
        align === "right"
          ? this.label(x + colW, mid, s.text, { ...opts, anchor: "end" })
          : this.label(cx, mid, s.text, opts)
    }
    if (cx - x + used > colW + 1)
      this.fig.warn(`cell "${s.text ?? s.tag ?? s.chip}" overflows its ${colW}px column in ${this.where}`)
  }

  // columns: [{ label, w, align }]. rows: arrays of cells, or { cells, accent }.
  table({ y = 0, columns, rows, rowH = 64, headH = 54, pad = 32 }) {
    const xs = []
    let x = pad
    for (const c of columns) {
      xs.push(x)
      x += c.w
    }
    if (x > this.w - pad + 1 && !this.allowBleed)
      this.fig.warn(`table columns (${x + pad}px) are wider than ${this.where} (${this.w}px)`)
    columns.forEach((c, i) => {
      if (!c.label) return
      const lx = c.align === "right" ? xs[i] + c.w : xs[i]
      this.label(lx, y + headH / 2, c.label, {
        size: SIZE.caps,
        tone: "mid",
        caps: true,
        anchor: c.align === "right" ? "end" : undefined,
      })
    })
    this.line(0, y + headH, this.w, y + headH, { stroke: this.t.rule })
    let ry = y + headH
    for (const row of rows) {
      const r = Array.isArray(row) ? { cells: row } : row
      if (r.accent) this.rect(0, ry, 3, rowH, { fill: this.color("violet") })
      r.cells.forEach((spec, i) => this.cell(xs[i], ry + rowH / 2, columns[i].w, spec, columns[i].align))
      ry += rowH
      this.line(0, ry, this.w, ry, { stroke: this.t.rule })
    }
    return ry
  }

  // A row of tags that wraps inside [x, x + w]. Returns the bottom y.
  tags(x, y, w, items, { gap = 10, lineH = 42 } = {}) {
    let cx = x
    let cy = y + lineH / 2
    for (const it of items) {
      const s = typeof it === "string" ? { tag: it } : it
      const tw = measure(s.tag, SIZE.cell) + 24
      if (cx + tw > x + w && cx > x) {
        cx = x
        cy += lineH
      }
      this.tag(cx, cy, s.tag, { dashed: s.dashed, tone: s.tone })
      cx += tw + gap
    }
    return cy + lineH / 2
  }
}

export class Figure extends Layer {
  constructor({ name, width, height, theme, alt }) {
    const t = THEMES[theme]
    super({ t, stats: { accent: 0 } }, width, height, name)
    this.fig = this
    this.t = t
    this.name = name
    this.alt = alt
    this.theme = theme
    this.stats = { accent: 0 }
    this.warnings = []
    this.defs = []
    this.ids = 0
    this.defs.push(
      `<filter id="sh" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="${t.shadow}" flood-opacity="${t.shadowOpacity}"/></filter>`,
      `<filter id="gr" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="table" tableValues="0 1"/></feComponentTransfer><feComposite in2="SourceGraphic" operator="in"/></filter>`,
      `<pattern id="dt" width="11" height="11" patternUnits="userSpaceOnUse"><rect x="4.5" y="4.5" width="1.6" height="1.6" fill="${t.dot}"/></pattern>`
    )
  }

  warn(msg) {
    if (!this.warnings.includes(msg)) this.warnings.push(msg)
  }

  // Quiet background tiles, denser toward the edges of the canvas. `clear`
  // lists rects (wire corridors, gaps between panels) no tile may touch.
  // Tiles always paint first, so call this last, once the layout is known.
  tiles({ seed = 1, size = 88, density = 0.28, ox = 0, oy = 0, clear = [] } = {}) {
    const rand = rng(seed)
    const drawn = this.out
    this.out = []
    const cols = Math.ceil((this.w - ox) / size) + 1
    const rows = Math.ceil((this.h - oy) / size) + 1
    for (let j = -1; j < rows; j++) {
      for (let i = -1; i < cols; i++) {
        const x = ox + i * size
        const y = oy + j * size
        const ex = Math.abs((x + size / 2) / this.w - 0.5) * 2
        const ey = Math.abs((y + size / 2) / this.h - 0.5) * 2
        const edge = Math.max(ex, ey)
        if (rand() > density * (0.25 + edge)) continue
        const k = rand()
        if (clear.some((c) => x < c.x + c.w && x + size > c.x && y < c.y + c.h && y + size > c.y)) continue
        if (k < 0.45) this.rect(x + 0.5, y + 0.5, size - 1, size - 1, { stroke: this.t.tile })
        else if (k < 0.8) this.rect(x, y, size, size, { fill: "url(#dt)" })
        else {
          this.rect(x, y, size, size, { fill: this.t.grain })
          this.out.push(
            `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="${this.t.mid}" opacity="${this.t.grainOpacity}" filter="url(#gr)"/>`
          )
        }
      }
    }
    this.out = this.out.concat(drawn)
  }

  // An opaque plate. `draw` gets a layer whose origin is the panel's top-left
  // and whose drawing is clipped to the panel. Without `h`, the panel is as
  // tall as the y that `draw` returns.
  panel({ x, y, w, h, shadow = true, name = "panel", bleed = false }, draw) {
    const id = `c${++this.ids}`
    const p = new Layer(this, w, h ?? Infinity, name)
    p.allowBleed = bleed
    const H = h ?? draw?.(p)
    if (h !== undefined) draw?.(p)
    if (typeof H !== "number") throw new Error(`${name}: give it an h, or return the bottom y from draw`)
    p.h = H
    this.defs.push(`<clipPath id="${id}"><rect x="0" y="0" width="${w}" height="${H}"/></clipPath>`)
    if (shadow)
      this.out.push(`<rect x="${x}" y="${y}" width="${w}" height="${H}" fill="${this.t.plate}" filter="url(#sh)"/>`)
    this.out.push(`<rect x="${x}" y="${y}" width="${w}" height="${H}" fill="${this.t.plate}"/>`)
    this.out.push(
      `<g transform="translate(${x} ${y})"><g clip-path="url(#${id})">${p.out.join("")}</g></g>`
    )
    this.rect(x + 0.5, y + 0.5, w - 1, H - 1, { stroke: this.t.line })
    return { x, y, w, h: H }
  }

  // Back-to-front stack of panels, each one step further down-left.
  cascade({ x, y, w, h, dx = -60, dy = 86 }, panels) {
    panels.forEach((draw, i) => {
      const n = panels.length - 1 - i
      this.panel({ x: x - n * dx, y: y - n * dy, w, h, name: `cascade ${i}`, bleed: true }, draw)
    })
  }

  // An orthogonal connector ending in a small square.
  wire(points, { dash, end = true } = {}) {
    const d = points.map(([px, py], i) => `${i ? "L" : "M"}${r1(px)} ${r1(py)}`).join(" ")
    const da = dash ? ` stroke-dasharray="${dash}"` : ""
    this.out.push(`<path d="${d}" fill="none" stroke="${this.t.wire}" stroke-width="1"${da}/>`)
    if (end) {
      const [ex, ey] = points[points.length - 1]
      this.rect(ex - 3, ey - 3, 6, 6, { fill: this.t.wire })
    }
  }

  svg() {
    return [
      `<svg xmlns="http://www.w3.org/2000/svg" width="${this.w}" height="${this.h}" viewBox="0 0 ${this.w} ${this.h}" font-family="${FONT}" role="img" aria-label="${esc(this.alt)}">`,
      `<title>${esc(this.alt)}</title>`,
      `<defs>${this.defs.join("")}</defs>`,
      this.out.join(""),
      `</svg>`,
    ].join("\n")
  }
}

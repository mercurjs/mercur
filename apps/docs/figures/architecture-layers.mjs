const CLIENTS = [
  ["Admin", "@mercurjs/admin", "dashboard-sdk"],
  ["Vendor", "@mercurjs/vendor", "dashboard-sdk"],
  ["Storefront", "Next.js or any", "framework"],
  ["Services", "ERP · PIM", "AI agents"],
]

const SURFACES = [
  ["/admin/*", "role-gated"],
  ["/vendor/*", "seller-scoped"],
  ["/store/*", "public"],
]

const DOMAINS = [
  {
    label: "Marketplace",
    sub: "@mercurjs/core",
    marker: "violet",
    tags: ["seller", "offer", "commission", "payout", "product-edit", "product-attribute", "review", "custom-fields"],
  },
  {
    label: "Commerce",
    sub: "@medusajs/medusa",
    marker: "mid",
    tags: ["product", "pricing", "cart", "order", "payment", "fulfillment", "inventory", "promotion"],
  },
  {
    label: "Yours",
    sub: "src/",
    marker: "lo",
    tags: [
      { tag: "modules", dashed: true },
      { tag: "workflow hooks", dashed: true },
      { tag: "api routes", dashed: true },
      { tag: "subscribers", dashed: true },
      { tag: "blocks", dashed: true },
    ],
  },
  {
    label: "Links",
    sub: "defineLink",
    marker: "lo",
    tags: ["product ↔ seller", "offer ↔ variant", "order-group ↔ order"],
  },
]

const INFRA = [
  ["PostgreSQL", "one database"],
  ["Redis", "events · workflows · locks"],
  ["Providers", "payments · payouts · search"],
]

const X = 40
const W = 960

export default {
  name: "architecture-layers",
  width: 1040,
  height: 1090,
  alt: "Mercur's architecture: the admin and vendor panels, a storefront, and your services call the backend through @mercurjs/client. The backend exposes /admin, /vendor, and /store and runs marketplace modules from @mercurjs/core beside Medusa's commerce modules and your own code, over PostgreSQL, Redis, and providers.",
  draw(f) {
    const cw = (W - 3 * 24) / 4
    const cx = (i) => X + i * (cw + 24) + cw / 2
    const sw = W / 3
    const sx = (i) => X + i * sw + sw / 2

    const clientTop = 48
    const clientBottom = clientTop + 132
    CLIENTS.forEach(([title, a, b], i) => {
      f.panel({ x: X + i * (cw + 24), y: clientTop, w: cw, h: 132, name: title }, (p) => {
        p.header({ h: 60, marker: "hi", title, pad: 20 })
        p.label(20, 60 + 26, a, { size: 15, tone: "text" })
        p.label(20, 60 + 50, b, { size: 15, tone: "lo" })
      })
    })

    const bandTop = clientBottom + 40
    CLIENTS.forEach((_, i) => f.wire([[cx(i), clientBottom], [cx(i), bandTop]]))
    const band = f.panel({ x: X, y: bandTop, w: W, h: 64, name: "client" }, (p) => {
      const w = p.label(24, 32, "@mercurjs/client", { tone: "hi", weight: 500 })
      p.label(24 + w + 24, 32, "typed by mercurjs codegen", { size: 15, tone: "lo" })
      p.label(W - 24, 32, "@mercurjs/types", { size: 15, tone: "mid", anchor: "end" })
    })

    const backendTop = band.y + band.h + 44
    SURFACES.forEach((_, i) => f.wire([[sx(i), band.y + band.h], [sx(i), backendTop]]))

    const backend = f.panel({ x: X, y: backendTop, w: W, name: "backend" }, (p) => {
      SURFACES.forEach(([path, scope], i) => {
        if (i) p.line(i * sw, 0, i * sw, 72)
        p.label(i * sw + 24, 36, path, { tone: "hi", weight: 500 })
        p.label((i + 1) * sw - 24, 36, scope, { size: 15, tone: "lo", anchor: "end" })
      })
      p.line(0, 72, W, 72)

      let y = 72
      for (const d of DOMAINS) {
        const top = y + 14
        const lx = 24 + p.marker(24, top + 21, d.marker) + 12
        p.label(lx, top + 21, d.label, { size: 14, tone: "hi", caps: true })
        p.label(lx, top + 46, d.sub, { size: 15, tone: "lo" })
        const bottom = Math.max(p.tags(244, top, W - 244 - 24, d.tags), top + 62)
        y = bottom + 14
        p.line(0, y, W, y, { stroke: f.t.rule })
      }

      p.label(24, y + 28, "withMercur() · one Node process", { size: 15, tone: "lo" })
      p.label(W - 24, y + 28, "route → workflow → module", { size: 15, tone: "lo", anchor: "end" })
      return y + 56
    })

    const iw = (W - 2 * 24) / 3
    const backendBottom = backend.y + backend.h
    const infraTop = backendBottom + 56
    INFRA.forEach(([title, sub], i) => {
      const x = X + i * (iw + 24)
      f.wire([[x + iw / 2, backendBottom], [x + iw / 2, infraTop]])
      f.panel({ x, y: infraTop, w: iw, h: 112, name: title }, (p) => {
        p.header({ h: 60, marker: "lo", title, pad: 20 })
        p.label(20, 60 + 26, sub, { size: 15, tone: "mid" })
      })
    })

    f.tiles({
      seed: 4,
      density: 0.22,
      clear: [
        { x: X, y: clientBottom, w: W, h: bandTop - clientBottom },
        { x: X, y: band.y + band.h, w: W, h: backendTop - band.y - band.h },
        { x: X, y: backendBottom, w: W, h: infraTop - backendBottom },
      ],
    })
  },
}

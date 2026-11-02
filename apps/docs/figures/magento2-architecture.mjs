const MAGENTO_MODULES = [
  "Mercur_Core",
  "Mercur_Process",
  "Mercur_Connector",
  "Mercur_OfferIndexer",
  "Mercur_Catalog",
  "Mercur_Settlement",
  "Mercur_Frontend",
  "Mercur_GraphQl",
  { tag: "Mercur_Inventory", dashed: true },
]

const CHANNELS = [
  {
    title: "Admin API",
    marker: "mid",
    auth: "secret API key",
    lines: ["GET /admin/offers", "GET /admin/sellers", "…/payments/capture"],
  },
  {
    title: "Store API",
    marker: "mid",
    auth: "publishable key",
    lines: ["POST /store/carts", "/store/shipping-options", "…/carts/:id/complete"],
  },
  {
    title: "Webhooks",
    marker: "violet",
    auth: "HMAC-SHA256",
    lines: ["POST /mercur/webhook", "offer.updated", "shipment.created"],
  },
]

const PLUGIN = ["magento_webhook", "pp_external_external", "/admin/magento/*", "Settings → Magento"]
const CORE = ["seller", "offer", "order-group", "commission", "payout"]

const X = 40
const W = 960
const GAP = 24

export default {
  name: "magento2-architecture",
  width: 1040,
  height: 964,
  alt: "Magento 2, running the nine Mercur modules, sits above Mercur, running @mercurjs/magento2-connector-plugin beside the marketplace modules. Between them are three channels: the Admin API with a secret key and the Store API with a publishable key, which Magento calls, and signed webhooks to POST /mercur/webhook, which Mercur sends.",
  draw(f) {
    const magento = f.panel({ x: X, y: 48, w: W, name: "magento" }, (p) => {
      p.header({ h: 68, marker: "hi", title: "Magento 2", note: "mercurjs/magento2-connector" })
      p.label(24, 68 + 30, "storefront · cart · checkout · payment · your catalog", { size: 15, tone: "mid" })
      const bottom = p.tags(24, 68 + 54, W - 48, MAGENTO_MODULES)
      return bottom + 24
    })

    const cw = (W - 2 * GAP) / 3
    const cx = (i) => X + i * (cw + GAP)
    const chanTop = magento.y + magento.h + 56
    const chanH = 246
    CHANNELS.forEach((c, i) => {
      f.wire([[cx(i) + cw / 2, magento.y + magento.h], [cx(i) + cw / 2, chanTop]])
      f.panel({ x: cx(i), y: chanTop, w: cw, h: chanH, name: c.title }, (p) => {
        p.header({ h: 64, marker: c.marker, title: c.title, pad: 20 })
        p.label(20, 64 + 28, c.auth, { size: 14, tone: "lo", caps: true })
        p.line(0, 64 + 52, cw, 64 + 52, { stroke: f.t.rule })
        c.lines.forEach((line, j) => {
          p.label(20, 64 + 82 + j * 34, line, { size: 15, tone: j === 0 ? "hi" : "text" })
        })
      })
    })

    const chanBottom = chanTop + chanH
    const mercurTop = chanBottom + 56
    CHANNELS.forEach((_, i) => f.wire([[cx(i) + cw / 2, chanBottom], [cx(i) + cw / 2, mercurTop]]))

    const mercur = f.panel({ x: X, y: mercurTop, w: W, name: "mercur" }, (p) => {
      p.header({ h: 68, marker: "hi", title: "Mercur API", note: "withMercur()" })
      let y = 68 + 14
      const rows = [
        { label: "Plugin", sub: "@mercurjs/magento2-connector-plugin", tags: PLUGIN },
        { label: "Core", sub: "@mercurjs/core", tags: CORE },
      ]
      rows.forEach((r, i) => {
        p.label(24, y + 21, r.label, { size: 14, tone: "hi", caps: true })
        p.label(24, y + 46, r.sub, { size: 15, tone: "lo" })
        const bottom = Math.max(p.tags(420, y, W - 420 - 24, r.tags), y + 62)
        y = bottom + 14
        if (i < rows.length - 1) p.line(0, y, W, y, { stroke: f.t.rule })
        y += i < rows.length - 1 ? 14 : 0
      })
      return y + 10
    })

    f.tiles({
      seed: 11,
      density: 0.22,
      clear: [
        { x: X, y: magento.y + magento.h, w: W, h: chanTop - magento.y - magento.h },
        { x: X, y: chanTop, w: W, h: chanH },
        { x: X, y: chanBottom, w: W, h: mercurTop - chanBottom },
        { x: X, y: mercur.y, w: W, h: mercur.h },
      ],
    })
  },
}

const LEFT = { x: 40, y: 96, w: 470, h: 330 }
const RIGHT = { x: 580, y: 180, w: 420, h: 300 }

export default {
  name: "use-case-hybrid",
  width: 1040,
  height: 540,
  alt: "A product page in your own store lists your warehouse next to two seller offers from ACME and GLOBEX. A wire leads from the seller rows to a Mercur order group with one order per seller; your own line never leaves your store.",
  draw(f) {
    f.panel({ ...LEFT, name: "your store" }, (p) => {
      p.header({
        marker: "mid",
        title: "Linen shirt",
        note: "your store · product page",
      })
      p.table({
        y: 76,
        columns: [
          { label: "Sold by", w: 180 },
          { label: "Price", w: 100, align: "right" },
          { label: "Source", w: 126, align: "right" },
        ],
        rowH: 56,
        rows: [
          ["Your warehouse", "€ 49.00", { chip: "yours", tone: "green" }],
          ["ACME", "€ 47.00", { chip: "offer", tone: "mid" }],
          ["GLOBEX", "€ 45.00", { chip: "offer", tone: "mid" }],
        ],
      })
      p.line(0, 298, LEFT.w, 298)
      p.label(32, 314, "1 payment, in your checkout", { size: 15, tone: "lo" })
    })

    const fromY = LEFT.y + 76 + 54 + 56 + 56
    f.wire([
      [LEFT.x + LEFT.w, fromY],
      [LEFT.x + LEFT.w + 35, fromY],
      [LEFT.x + LEFT.w + 35, RIGHT.y + 38],
      [RIGHT.x + 6, RIGHT.y + 38],
    ])

    f.panel({ ...RIGHT, name: "mercur" }, (p) => {
      p.header({
        marker: "violet",
        title: "Order group #G1042",
        note: "Mercur",
      })
      p.table({
        y: 76,
        columns: [
          { label: "Order", w: 120 },
          { label: "Seller", w: 116 },
          { label: "Status", w: 120, align: "right" },
        ],
        rowH: 56,
        rows: [
          { accent: true, cells: ["#1042-1", "ACME", { chip: "shipped", tone: "green" }] },
          ["#1042-2", "GLOBEX", { chip: "open", tone: "amber" }],
        ],
      })
      p.line(0, 242, RIGHT.w, 242)
      p.label(32, 270, "commission · payout per seller", { size: 15, tone: "lo" })
    })

    f.tiles({
      seed: 17,
      density: 0.22,
      clear: [{ x: LEFT.x + LEFT.w, y: RIGHT.y, w: RIGHT.x - LEFT.x - LEFT.w, h: fromY - RIGHT.y + 20 }],
    })
  },
}

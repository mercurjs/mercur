export default {
  name: "attribute-variant-axis",
  width: 1040,
  height: 560,
  alt: "The Size axis attribute maps each value to a Medusa option value, S to optval_01JD8Q1 and so on, and the Linen shirt selects only S and M, so its variants behind it are S and M.",
  draw(f) {
    f.tiles({ seed: 19 })
    f.cascade({ x: 40, y: 150, w: 900, h: 323 }, [
      (p) => {
        p.header({
          marker: "mid",
          title: "Linen shirt",
          tabs: ["Variants", "Attributes"],
          note: "prod_01JD8Q1",
        })
        p.table({
          y: 76,
          columns: [
            { label: "Variant", w: 300 },
            { label: "Size", w: 200 },
            { label: "SKU", w: 336, align: "right" },
          ],
          rows: [
            ["Linen shirt / S", "S", { text: "SHIRT-S", tone: "mid" }],
            ["Linen shirt / M", "M", { text: "SHIRT-M", tone: "mid" }],
          ],
        })
      },
      (p) => {
        p.header({
          marker: "violet",
          title: "Size",
          tabs: ["Values", "Products"],
          note: "opt_01JD8Q1",
        })
        p.table({
          y: 76,
          columns: [
            { label: "Value", w: 120 },
            { label: "Attribute value", w: 260 },
            { label: "Option value", w: 240 },
            { label: "Linen shirt", w: 216, align: "right" },
          ],
          rows: [
            ["S", { text: "pattrval_01JD8Q1", tone: "text" }, { text: "optval_01JD8Q1", tone: "text" }, { toggle: true }],
            ["M", { text: "pattrval_01JD8Q2", tone: "text" }, { text: "optval_01JD8Q2", tone: "text" }, { toggle: true }],
            ["L", { text: "pattrval_01JD8Q3", tone: "text" }, { text: "optval_01JD8Q3", tone: "text" }, { toggle: false }],
          ],
        })
      },
    ])
  },
}

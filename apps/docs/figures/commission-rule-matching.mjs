export default {
  name: "commission-rule-matching",
  width: 1040,
  height: 672,
  alt: "Resolving the rate for a Linen shirt sold by ACME in the Shirts category: four enabled rates match, the acme-shirts rate scopes on two dimensions and wins, lighting does not match, and the default rate ranks last.",
  draw(f) {
    f.tiles({ seed: 41 })
    f.cascade({ x: 40, y: 168, w: 900, h: 451 }, [
      (p) => {
        p.header({ marker: "mid", title: "Line item", tabs: ["Product", "Offer"], note: "ordli_01JD8Q" })
        p.table({
          y: 76,
          columns: [
            { label: "Dimension", w: 360 },
            { label: "Value", w: 476, align: "right" },
          ],
          rows: [
            ["product", "prod_01JD8Q"],
            ["product_type", "ptyp_apparel"],
            ["product_category", "pcat_shirts"],
            ["seller", "sel_acme"],
          ],
        })
      },
      (p) => {
        p.header({
          marker: "violet",
          title: "Candidate rates",
          tabs: ["Enabled"],
          note: "most specific wins",
        })
        p.table({
          y: 76,
          columns: [
            { label: "Rate", w: 220 },
            { label: "Rules", w: 290 },
            { label: "Dims", w: 90, align: "right" },
            { label: "Match", w: 236, align: "right" },
          ],
          rows: [
            {
              accent: true,
              cells: ["acme-shirts", "seller · category", "2", { chip: "Wins", tone: "green" }],
            },
            ["acme-apparel", { text: "seller", tone: "mid" }, { text: "1", tone: "mid" }, { chip: "Match", tone: "green" }],
            ["shirts-flat", { text: "category", tone: "mid" }, { text: "1", tone: "mid" }, { chip: "Match", tone: "green" }],
            ["lighting", { text: "product_type", tone: "mid" }, { text: "1", tone: "mid" }, { chip: "No match", tone: "red" }],
            ["default", { text: "none", tone: "mid" }, { text: "0", tone: "mid" }, { chip: "Match", tone: "green" }],
          ],
        })
      },
    ])
  },
}

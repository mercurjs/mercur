export default {
  name: "commission-overview",
  width: 1040,
  height: 610,
  alt: "Commission rates behind the commission lines of order #100: the Linen shirt line matches the 12% acme-apparel rate for € 5.64, while the Desk lamp line and the shipping method fall back to the 10% default rate.",
  draw(f) {
    f.tiles({ seed: 23 })
    f.cascade({ x: 40, y: 168, w: 900, h: 387 }, [
      (p) => {
        p.header({ marker: "mid", title: "Commission rates", tabs: ["Rates", "Rules", "Values"], note: "commission_rate" })
        p.table({
          y: 76,
          columns: [
            { label: "Code", w: 300 },
            { label: "Type", w: 200 },
            { label: "Rules", w: 160 },
            { label: "Value", w: 176, align: "right" },
          ],
          rows: [
            ["default", "percentage", "0", "10"],
            ["acme-apparel", "percentage", "1", "12"],
            ["flat-fee", "fixed", "1", "2.50"],
          ],
        })
      },
      (p) => {
        p.header({
          marker: "violet",
          title: "Commission lines",
          tabs: ["Items", "Shipping"],
          note: "order #100",
        })
        p.table({
          y: 76,
          columns: [
            { label: "Line", w: 196 },
            { label: "Code", w: 210 },
            { label: "Rate", w: 110, align: "right" },
            { label: "Subtotal", w: 160, align: "right" },
            { label: "Amount", w: 160, align: "right" },
          ],
          rows: [
            {
              accent: true,
              cells: ["Linen shirt", "acme-apparel", "12", "€ 47.00", "€ 5.64"],
            },
            [
              "Desk lamp",
              { text: "default", tone: "mid" },
              { text: "10", tone: "mid" },
              { text: "€ 40.00", tone: "mid" },
              "€ 4.00",
            ],
            [
              "Shipping",
              { text: "default", tone: "mid" },
              { text: "10", tone: "mid" },
              { text: "€ 5.00", tone: "mid" },
              "€ 0.50",
            ],
            [
              { text: "Total", tone: "mid" },
              "",
              "",
              { text: "€ 92.00", tone: "mid" },
              "€ 10.14",
            ],
          ],
        })
      },
    ])
  },
}

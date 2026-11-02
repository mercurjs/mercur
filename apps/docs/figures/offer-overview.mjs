export default {
  name: "offer-overview",
  width: 1040,
  height: 610,
  alt: "The Linen shirt master product sits behind an Offers list for its M variant: ACME, GLOBEX, and INITECH each list the same variant with their own SKU, condition, price, and stock.",
  draw(f) {
    f.tiles({ seed: 23 })
    f.cascade({ x: 40, y: 168, w: 900, h: 387 }, [
      (p) => {
        p.header({
          marker: "mid",
          title: "Linen shirt",
          tabs: ["Variants", "Attributes", "Media"],
          note: "prod_01JD8Q",
        })
        p.table({
          y: 76,
          columns: [
            { label: "Variant", w: 300 },
            { label: "Variant id", w: 336 },
            { label: "Offers", w: 200, align: "right" },
          ],
          rows: [
            ["S", { text: "variant_01JD8Q1", tone: "mid" }, "2"],
            ["M", { text: "variant_01JD8Q2", tone: "mid" }, "4"],
            ["L", { text: "variant_01JD8Q3", tone: "mid" }, "1"],
          ],
        })
      },
      (p) => {
        p.header({
          marker: "violet",
          title: "Offers",
          tabs: ["Linen shirt / M"],
          note: "variant_01JD8Q2",
        })
        p.table({
          y: 76,
          columns: [
            { label: "Store", w: 140 },
            { label: "SKU", w: 230 },
            { label: "Condition", w: 170 },
            { label: "Price", w: 150, align: "right" },
            { label: "Stock", w: 146, align: "right" },
          ],
          rows: [
            {
              accent: true,
              cells: ["ACME", "ACME-LS-M", { tag: "new" }, "€ 47.00", "50"],
            },
            [
              "ACME",
              "ACME-LS-M-RF",
              { tag: "refurbished" },
              "€ 32.00",
              "4",
            ],
            ["GLOBEX", "GBX-1042", { tag: "new" }, "€ 45.00", "12"],
            [
              "INITECH",
              "INI-SHIRT-M",
              { tag: "new" },
              "€ 49.00",
              { text: "0", tone: "mid" },
            ],
          ],
        })
      },
    ])
  },
}

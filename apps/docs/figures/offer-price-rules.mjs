export default {
  name: "offer-price-rules",
  width: 1040,
  height: 610,
  alt: "The shared price set of the Linen shirt M variant holds price rows for three offers; each row carries an offer_id rule, and the two rows for offer_01JD8QA form a quantity tier. Behind it, that offer links to its own inventory items.",
  draw(f) {
    f.tiles({ seed: 31 })
    f.cascade({ x: 40, y: 168, w: 900, h: 387 }, [
      (p) => {
        p.header({
          marker: "mid",
          title: "Offer",
          tabs: ["Prices", "Inventory"],
          active: 1,
          note: "offer_01JD8QA",
        })
        p.table({
          y: 76,
          columns: [
            { label: "Inventory item", w: 336 },
            { label: "Location", w: 300 },
            { label: "Required", w: 200, align: "right" },
          ],
          rows: [
            [{ text: "iitem_01JD8Q1", tone: "mid" }, "Warehouse A", "1"],
            [{ text: "iitem_01JD8Q2", tone: "mid" }, "Warehouse A", "1"],
            [{ text: "iitem_01JD8Q3", tone: "mid" }, "Warehouse B", "2"],
          ],
        })
      },
      (p) => {
        p.header({
          marker: "violet",
          title: "Price set",
          tabs: ["Linen shirt / M"],
          note: "pset_01JD8Q2",
        })
        p.table({
          y: 76,
          columns: [
            { label: "Price", w: 230 },
            { label: "Amount", w: 150, align: "right" },
            { label: "Min qty", w: 150, align: "right" },
            { label: "Rule offer_id", w: 306, align: "right" },
          ],
          rows: [
            {
              accent: true,
              cells: ["price_01JD8Q1", "€ 47.00", "", "offer_01JD8QA"],
            },
            ["price_01JD8Q2", "€ 42.00", "10", "offer_01JD8QA"],
            [
              "price_01JD8Q3",
              "€ 32.00",
              "",
              { text: "offer_01JD8QB", tone: "mid" },
            ],
            [
              "price_01JD8Q4",
              "€ 45.00",
              "",
              { text: "offer_01JD8QC", tone: "mid" },
            ],
          ],
        })
      },
    ])
  },
}

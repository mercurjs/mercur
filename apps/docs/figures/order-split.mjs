export default {
  name: "order-split",
  width: 1040,
  height: 610,
  alt: "A cart with items from two sellers becomes order group #G98, split into order #100 for ACME and order #99 for GLOBEX, each with its own status, commission, and payout.",
  draw(f) {
    f.tiles({ seed: 11 })
    f.cascade({ x: 40, y: 168, w: 900, h: 387 }, [
      (p) => {
        p.header({ marker: "amber", title: "Cart", tabs: ["Items", "Shipping", "Payment"], note: "cart_01JD8Q" })
        p.table({
          y: 76,
          columns: [
            { label: "Item", w: 300 },
            { label: "Seller", w: 200 },
            { label: "Qty", w: 120, align: "right" },
            { label: "Price", w: 216, align: "right" },
          ],
          rows: [
            ["Linen shirt", "ACME", "1", "€ 47.00"],
            ["Desk lamp", "GLOBEX", "1", "€ 40.00"],
            ["Shipping", "", "", "€ 0.00"],
          ],
        })
      },
      (p) => {
        p.header({
          marker: "violet",
          title: "Orders",
          tabs: ["All", "Groups", "Returns"],
          active: 1,
          toggle: { on: true, label: "Split by seller" },
        })
        p.table({
          y: 76,
          columns: [
            { label: "Order", w: 120 },
            { label: "Store", w: 150 },
            { label: "Status", w: 220 },
            { label: "Commission", w: 120, align: "right" },
            { label: "Payout", w: 110, align: "right" },
            { label: "Total", w: 116, align: "right" },
          ],
          rows: [
            {
              accent: true,
              cells: [{ caret: true, text: "#G98" }, "2 stores", "", "€ 8.70", "€ 78.30", "€ 87.00"],
            },
            [
              { indent: 32, text: "#100" },
              "ACME",
              { chip: "Not fulfilled", tone: "red" },
              { text: "€ 4.70", tone: "mid" },
              { text: "€ 42.30", tone: "mid" },
              "€ 47.00",
            ],
            [
              { indent: 32, text: "#99" },
              "GLOBEX",
              { chip: "Delivered", tone: "green" },
              { text: "€ 4.00", tone: "mid" },
              { text: "€ 36.00", tone: "mid" },
              "€ 40.00",
            ],
            [
              { caret: false, text: "#G97", tone: "mid" },
              { text: "1 store", tone: "mid" },
              "",
              { text: "€ 2.10", tone: "mid" },
              { text: "€ 18.90", tone: "mid" },
              { text: "€ 21.00", tone: "mid" },
            ],
          ],
        })
      },
    ])
  },
}

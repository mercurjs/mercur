export default {
  name: "order-group-overview",
  width: 1040,
  height: 860,
  alt: "The order_group record og_01JD8Q1234567 in front, with display_id 98, its customer and read-only cart link, and computed seller_count 2 and total 87.00. Behind it, the order_group_order link lists the two child orders it sums: 47.00 for ACME and 40.00 for GLOBEX.",
  draw(f) {
    f.tiles({ seed: 7 })
    f.cascade({ x: 40, y: 302, w: 900, h: 514, dy: 262 }, [
      (p) => {
        p.header({
          marker: "hi",
          title: "orders",
          tabs: ["order_group_order", "order_seller"],
          note: "link",
        })
        p.table({
          y: 76,
          columns: [
            { label: "order_id", w: 330 },
            { label: "seller.name", w: 230 },
            { label: "current_order_total", w: 276, align: "right" },
          ],
          rows: [
            ["order_01JD8Q1234568", "ACME", "47.00"],
            ["order_01JD8Q1234569", "GLOBEX", "40.00"],
            ["", "", ""],
          ],
        })
      },
      (p) => {
        p.header({
          marker: "violet",
          title: "order_group",
          tabs: ["Fields", "Links"],
          note: "MercurModules.SELLER",
        })
        p.table({
          y: 76,
          columns: [
            { label: "Field", w: 230 },
            { label: "Type", w: 330 },
            { label: "Value", w: 276, align: "right" },
          ],
          rows: [
            ["id", { text: "id, prefix og", tone: "text" }, "og_01JD8Q1234567"],
            ["display_id", { text: "autoincrement", tone: "text" }, "98"],
            ["customer_id", { text: "text, nullable", tone: "text" }, "cus_01JD8Q1234567"],
            ["cart_id", { text: "text, read-only link", tone: "text" }, "cart_01JD8Q1234567"],
            ["seller_count", { text: "number, computed", tone: "text" }, "2"],
            {
              accent: true,
              cells: ["total", { text: "bigNumber, computed", tone: "text" }, "87.00"],
            },
          ],
        })
      },
    ])
  },
}

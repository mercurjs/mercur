export default {
  name: "catalog-overview",
  width: 1040,
  height: 560,
  alt: "A product_seller link table behind a Products list of the shared catalog: each master product shows its status, the stores on its allowlist, and its offer count, with the Linen shirt restricted to ACME highlighted.",
  draw(f) {
    f.tiles({ seed: 7 })
    f.cascade({ x: 40, y: 140, w: 900, h: 390 }, [
      (p) => {
        p.header({ marker: "hi", title: "product_seller", tabs: ["Links"], note: "Product ↔ Seller" })
        p.table({
          y: 76,
          columns: [
            { label: "product_id", w: 420 },
            { label: "seller_id", w: 416, align: "right" },
          ],
          rows: [
            ["prod_01JD8Q1234567", "sel_01JD8Q1234567"],
            ["prod_01JD8Q1234568", "sel_01JD8Q1234568"],
          ],
        })
      },
      (p) => {
        p.header({
          marker: "violet",
          title: "Products",
          tabs: ["All", "Proposed", "Rejected"],
          note: "shared catalog",
        })
        p.table({
          y: 76,
          columns: [
            { label: "Product", w: 230 },
            { label: "Status", w: 220 },
            { label: "Allowlist", w: 250 },
            { label: "Offers", w: 136, align: "right" },
          ],
          rows: [
            ["Aeron Chair", { chip: "Published", tone: "green" }, { text: "All stores", tone: "mid" }, "3"],
            {
              accent: true,
              cells: ["Linen shirt", { chip: "Published", tone: "green" }, { tag: "ACME" }, "1"],
            },
            ["Desk lamp", { chip: "Proposed", tone: "amber" }, { text: "All stores", tone: "mid" }, { text: "0", tone: "mid" }],
            ["Wool throw", { chip: "Rejected", tone: "red" }, { text: "All stores", tone: "mid" }, { text: "0", tone: "mid" }],
          ],
        })
      },
    ])
  },
}

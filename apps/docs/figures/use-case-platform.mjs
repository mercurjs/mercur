export default {
  name: "use-case-platform",
  width: 1040,
  height: 560,
  alt: "Three Mercur surfaces stacked back to front: the admin Sellers list, the vendor panel's Offers table for ACME, and the storefront product page for the Linen shirt listing the offers a shopper can buy.",
  draw(f) {
    f.tiles({ seed: 41, density: 0.24 })
    f.cascade({ x: 40, y: 190, w: 860, h: 330, dx: -70, dy: 76 }, [
      (p) => {
        p.header({
          marker: "mid",
          title: "Sellers",
          tabs: ["All", "Pending approval"],
          note: "/admin/sellers",
        })
        p.table({
          y: 76,
          columns: [
            { label: "Seller", w: 260 },
            { label: "Members", w: 160 },
            { label: "Offers", w: 160, align: "right" },
            { label: "Status", w: 216, align: "right" },
          ],
          rows: [
            ["ACME", "3", "128", { chip: "open", tone: "green" }],
            ["GLOBEX", "1", "41", { chip: "open", tone: "green" }],
            ["INITECH", "2", { text: "0", tone: "mid" }, { chip: "pending", tone: "amber" }],
          ],
        })
      },
      (p) => {
        p.header({
          marker: "mid",
          title: "Offers",
          tabs: ["All", "Out of stock"],
          note: "/vendor/offers · ACME",
        })
        p.table({
          y: 76,
          columns: [
            { label: "Product", w: 300 },
            { label: "SKU", w: 220 },
            { label: "Price", w: 140, align: "right" },
            { label: "Stock", w: 136, align: "right" },
          ],
          rows: [
            ["Linen shirt / M", "ACME-LS-M", "€ 47.00", "50"],
            ["Linen shirt / L", "ACME-LS-L", "€ 47.00", "18"],
            ["Wool scarf", "ACME-WS-1", "€ 29.00", { text: "0", tone: "mid" }],
          ],
        })
      },
      (p) => {
        p.header({
          marker: "violet",
          title: "Linen shirt",
          tabs: ["M"],
          note: "/store/products/linen-shirt",
        })
        p.table({
          y: 76,
          columns: [
            { label: "Sold by", w: 280 },
            { label: "Ships in", w: 180 },
            { label: "Price", w: 140, align: "right" },
            { label: "", w: 40 },
            { label: "", w: 156 },
          ],
          rows: [
            { accent: true, cells: ["ACME", "2 days", "€ 47.00", "", { tag: "Add to cart" }] },
            ["GLOBEX", "4 days", "€ 45.00", "", { tag: "Add to cart" }],
            ["INITECH", "1 day", "€ 49.00", "", { tag: "Add to cart" }],
          ],
        })
      },
    ])
  },
}

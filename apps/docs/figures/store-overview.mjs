export default {
  name: "store-overview",
  width: 1040,
  height: 560,
  alt: "A Stores list from the Seller module showing four stores, each with its status, currency, member count, and premium flag, in front of the Team panel for acme-supplies with three members and their seller roles.",
  draw(f) {
    f.tiles({ seed: 7 })
    f.cascade({ x: 40, y: 130, w: 900, h: 387 }, [
      (p) => {
        p.header({ marker: "hi", title: "Team", tabs: ["Members", "Invites"], note: "acme-supplies" })
        p.table({
          y: 76,
          columns: [
            { label: "Email", w: 300 },
            { label: "Role", w: 400 },
            { label: "Owner", w: 136, align: "right" },
          ],
          rows: [
            ["owner@acme.com", "role_seller_administration", { toggle: true }],
            ["ops@acme.com", "role_seller_order_management", { toggle: false }],
            ["books@acme.com", "role_seller_accounting", { toggle: false }],
          ],
        })
      },
      (p) => {
        p.header({
          marker: "violet",
          title: "Stores",
          tabs: ["All", "Pending", "Suspended"],
          note: "MercurModules.SELLER",
        })
        p.table({
          y: 76,
          columns: [
            { label: "Handle", w: 220 },
            { label: "Status", w: 236 },
            { label: "Currency", w: 130 },
            { label: "Members", w: 120, align: "right" },
            { label: "Premium", w: 130, align: "right" },
          ],
          rows: [
            {
              accent: true,
              cells: ["acme-supplies", { chip: "Open", tone: "green" }, "usd", "3", { toggle: true }],
            },
            ["globex", { chip: "Pending approval", tone: "amber" }, "eur", "1", { toggle: false }],
            ["initech", { chip: "Suspended", tone: "red" }, "usd", "2", { toggle: false }],
            [
              { text: "hooli", tone: "mid" },
              { chip: "Terminated", tone: "lo" },
              { text: "gbp", tone: "mid" },
              { text: "1", tone: "mid" },
              { toggle: false },
            ],
          ],
        })
      },
    ])
  },
}

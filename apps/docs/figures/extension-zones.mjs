export default {
  name: "extension-zones",
  width: 1040,
  height: 870,
  alt: "Stacked panels for Blocks, Panels, and Backend, with an Extensions table in front listing one file per zone: a workflow hook, an API route, a module, a custom field, a page, and a widget, each with its typed target.",
  draw(f) {
    f.tiles({ seed: 23 })
    f.cascade({ x: 40, y: 298, w: 826, h: 514, dx: -48 }, [
      (p) => {
        p.header({ marker: "amber", title: "Blocks", tabs: ["Installed", "Registry"], toggle: { on: false, label: "Overwrite" } })
        p.table({
          y: 76,
          columns: [
            { label: "Block", w: 300 },
            { label: "Files", w: 200 },
            { label: "Upstream", w: 262, align: "right" },
          ],
          rows: [
            ["wishlist", "9", { chip: "Synced", tone: "green" }],
            ["algolia", "6", { chip: "Diff", tone: "amber" }],
            ["vendor-chat", "21", { chip: "Synced", tone: "green" }],
            ["requests", "17", { chip: "Synced", tone: "green" }],
            ["vendor-notifications", "11", { chip: "Diff", tone: "amber" }],
            ["meilisearch", "6", { chip: "Synced", tone: "green" }],
          ],
        })
      },
      (p) => {
        p.header({
          marker: "green",
          title: "Panels",
          tabs: ["Pages", "Widgets", "Fields", "Navigation"],
          active: 1,
          toggle: { on: true, label: "Typed" },
        })
        p.table({
          y: 76,
          columns: [
            { label: "File", w: 380 },
            { label: "Zone", w: 382, align: "right" },
          ],
          rows: [
            ["payout-summary.tsx", "orders.detail.side.after"],
            ["order-sla.tsx", "orders.list.before"],
            ["offer-badges.tsx", "offers.list.after"],
            ["offer-docs.tsx", "offers.detail.main.after"],
            ["vip-note.tsx", "customers.detail.side"],
          ],
        })
      },
      (p) => {
        p.header({ marker: "hi", title: "Backend", tabs: ["Hooks", "Routes", "Modules"], note: "src/" })
        p.table({
          y: 76,
          columns: [
            { label: "Name", w: 300 },
            { label: "Workflow", w: 462, align: "right" },
          ],
          rows: [
            ["sellerApproved", "approveSellerWorkflow"],
            ["orderGroupCreated", "completeCartWithSplitOrdersWorkflow"],
            ["offersCreated", "createOffersWorkflow"],
            ["productChangeConfirmed", "confirmProductChangeWorkflow"],
            ["payoutsCreated", "createOrderPayoutsWorkflow"],
          ],
        })
      },
      (p) => {
        p.header({
          marker: "violet",
          title: "Extensions",
          tabs: ["All", "Backend", "Panels"],
          toggle: { on: true, label: "Typecheck" },
        })
        p.table({
          y: 76,
          columns: [
            { label: "Path", w: 414 },
            { label: "Zone", w: 128 },
            { label: "Target", w: 220 },
          ],
          rows: [
            { accent: true, cells: ["src/workflows/hooks/seller-approved.ts", { tag: "hook" }, "sellerApproved"] },
            ["src/api/vendor/sellers/documents/route.ts", { tag: "route" }, { text: "/vendor/sellers/…", tone: "text" }],
            ["src/modules/subscription/index.ts", { tag: "module" }, { text: "↔ seller", tone: "text" }],
            ["medusa-config.ts", { tag: "field" }, { text: "Product.is_featured", tone: "text" }],
            ["src/routes/reports/page.tsx", { tag: "page" }, { text: "/reports", tone: "text" }],
            ["src/widgets/payout-summary.tsx", { tag: "widget" }, { text: "orders.detail.side", tone: "text" }],
          ],
        })
      },
    ])
  },
}

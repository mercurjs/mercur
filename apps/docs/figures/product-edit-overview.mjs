export default {
  name: "product-edit-overview",
  width: 1040,
  height: 640,
  alt: "A product's Changes list read through product.changes: a pending UPDATE from the seller sits on top of confirmed PRODUCT_ADD, CHANGE_REQUESTED, UPDATE, and STATUS_CHANGE records that form the audit trail.",
  draw(f) {
    f.tiles({ seed: 7 })
    f.cascade({ x: 40, y: 150, w: 900, h: 450 }, [
      (p) => {
        p.header({ marker: "green", title: "Linen shirt", tabs: ["Details", "Variants", "Attributes"], note: "prod_01JD8Q" })
        p.table({
          y: 76,
          columns: [
            { label: "Field", w: 300 },
            { label: "Value", w: 536, align: "right" },
          ],
          rows: [
            ["title", "Linen shirt"],
            ["status", "published"],
            ["material", "Linen"],
          ],
        })
      },
      (p) => {
        p.header({
          marker: "violet",
          title: "Changes",
          tabs: ["All", "Pending", "Audit"],
          note: "product.changes",
        })
        p.table({
          y: 76,
          columns: [
            { label: "Change", w: 180 },
            { label: "Actions", w: 290 },
            { label: "By", w: 170 },
            { label: "Status", w: 196, align: "right" },
          ],
          rows: [
            {
              accent: true,
              cells: ["prodch_05", "UPDATE × 2", "sel_01JD8Q", { chip: "Pending", tone: "amber" }],
            },
            [{ text: "prodch_04", tone: "mid" }, "STATUS_CHANGE", "user_01JD8R", { chip: "Confirmed", tone: "green" }],
            [{ text: "prodch_03", tone: "mid" }, "UPDATE", "sel_01JD8Q", { chip: "Confirmed", tone: "green" }],
            [{ text: "prodch_02", tone: "mid" }, "CHANGE_REQUESTED", "user_01JD8R", { chip: "Confirmed", tone: "green" }],
            [{ text: "prodch_01", tone: "mid" }, "PRODUCT_ADD", "sel_01JD8Q", { chip: "Confirmed", tone: "green" }],
          ],
        })
      },
    ])
  },
}

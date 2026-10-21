export default {
  name: "review-moderation",
  width: 1040,
  height: 680,
  alt: "Behind, a review record. In front, the changes each workflow makes: updateReviewWorkflow moves status between pending, published, and rejected in any direction, respondReviewWorkflow sets seller_note once, and deleteReviewWorkflow sets deleted_at.",
  draw(f) {
    f.tiles({ seed: 5 })
    f.cascade({ x: 40, y: 196, w: 900, h: 450 }, [
      (p) => {
        p.header({ marker: "mid", title: "review", note: "Review module" })
        p.table({
          y: 76,
          columns: [
            { label: "Field", w: 300 },
            { label: "Value", w: 536 },
          ],
          rows: [
            ["status", { text: "pending", tone: "mid" }],
            ["seller_note", { text: "null", tone: "mid" }],
            ["deleted_at", { text: "null", tone: "mid" }],
          ],
        })
      },
      (p) => {
        p.header({ marker: "violet", title: "Review changes", note: "rev_01JD8Q1234567" })
        p.table({
          y: 76,
          columns: [
            { label: "From", w: 160 },
            { label: "To", w: 190 },
            { label: "Workflow", w: 300 },
            { label: "Surface", w: 186, align: "right" },
          ],
          rows: [
            {
              accent: true,
              cells: ["pending", { chip: "Published", tone: "green" }, "updateReviewWorkflow", "admin"],
            },
            ["pending", { chip: "Rejected", tone: "red" }, "updateReviewWorkflow", "admin"],
            ["published", { chip: "Pending", tone: "amber" }, "updateReviewWorkflow", "admin"],
            [
              { text: "null", tone: "mid" },
              { text: "seller_note", tone: "text" },
              "respondReviewWorkflow",
              "vendor, admin",
            ],
            [
              { text: "null", tone: "mid" },
              { text: "deleted_at", tone: "text" },
              "deleteReviewWorkflow",
              "admin, store",
            ],
          ],
        })
      },
    ])
  },
}

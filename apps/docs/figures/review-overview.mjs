export default {
  name: "review-overview",
  width: 1040,
  height: 600,
  alt: "Behind, createReviewWorkflow, which writes every review. In front, the review table: order #1001 backs a published seller review of ACME and a pending product review of the linen shirt, beside a rejected review from order #998.",
  draw(f) {
    f.tiles({ seed: 7 })
    f.cascade({ x: 40, y: 196, w: 900, h: 330 }, [
      (p) => {
        p.header({ marker: "mid", title: "createReviewWorkflow", note: "CreateReviewDTO" })
        p.table({
          y: 76,
          columns: [
            { label: "Step", w: 300 },
            { label: "Does", w: 536 },
          ],
          rows: [
            ["validate-review", { text: "order belongs to customer, no duplicate", tone: "mid" }],
            ["create-review", { text: "review, customer and order links", tone: "mid" }],
            ["create-remote-links", { text: "product or seller link", tone: "mid" }],
          ],
        })
      },
      (p) => {
        p.header({
          marker: "violet",
          title: "Reviews",
          tabs: ["All", "Product", "Seller"],
          note: "rev_",
        })
        p.table({
          y: 76,
          columns: [
            { label: "Review", w: 110 },
            { label: "Reference", w: 150 },
            { label: "Target", w: 160 },
            { label: "Order", w: 110 },
            { label: "Rating", w: 90, align: "right" },
            { label: "Status", w: 216, align: "right" },
          ],
          rows: [
            {
              accent: true,
              cells: ["#1043", "seller", "ACME", "#1001", "5", { chip: "Published", tone: "green" }],
            },
            ["#1042", "product", "Linen shirt", "#1001", "4", { chip: "Pending", tone: "amber" }],
            [
              { text: "#1041", tone: "mid" },
              { text: "product", tone: "mid" },
              { text: "Desk lamp", tone: "mid" },
              { text: "#998", tone: "mid" },
              { text: "2", tone: "mid" },
              { chip: "Rejected", tone: "red" },
            ],
          ],
        })
      },
    ])
  },
}

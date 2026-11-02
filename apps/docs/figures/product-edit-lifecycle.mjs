export default {
  name: "product-edit-lifecycle",
  width: 1040,
  height: 580,
  alt: "The ProductChangeStatus table: a change enters pending through stageProductChangeWorkflow, then confirmProductChangeWorkflow, rejectProductChangeWorkflow, or cancelProductChangeWorkflow moves it to confirmed, declined, or canceled, each emitting its own event and stamping its own actor field.",
  draw(f) {
    f.tiles({ seed: 19 })
    f.cascade({ x: 40, y: 150, w: 960, h: 386, dx: -40 }, [
      (p) => {
        p.header({ marker: "mid", title: "prodch_01JD8Q", tabs: ["Actions", "Notes"], note: "prod_01JD8Q" })
        p.table({
          y: 76,
          columns: [
            { label: "Action", w: 260 },
            { label: "Details", w: 380 },
            { label: "Applied", w: 256, align: "right" },
          ],
          rows: [
            ["UPDATE", "{ field: \"title\" }", { toggle: false }],
            ["UPDATE", "{ field: \"material\" }", { toggle: false }],
          ],
        })
      },
      (p) => {
        p.header({
          marker: "violet",
          title: "ProductChangeStatus",
          tabs: ["Transitions"],
          toggle: { on: true, label: "product_request" },
        })
        p.table({
          y: 76,
          columns: [
            { label: "Status", w: 186 },
            { label: "Reached by", w: 290 },
            { label: "Event", w: 270 },
            { label: "Stamps", w: 150, align: "right" },
          ],
          rows: [
            [{ chip: "Pending", tone: "amber" }, "stageProductChangeWorkflow", { text: "product-change.created", tone: "text" }, { text: "created_by", tone: "mid" }],
            {
              accent: true,
              cells: [{ chip: "Confirmed", tone: "green" }, "confirmProductChangeWorkflow", { text: "product-change.confirmed", tone: "text" }, { text: "confirmed_by", tone: "mid" }],
            },
            [{ chip: "Declined", tone: "red" }, "rejectProductChangeWorkflow", { text: "product-change.declined", tone: "text" }, { text: "declined_by", tone: "mid" }],
            [{ chip: "Canceled", tone: "lo" }, "cancelProductChangeWorkflow", { text: "product-change.canceled", tone: "text" }, { text: "canceled_by", tone: "mid" }],
          ],
        })
      },
    ])
  },
}

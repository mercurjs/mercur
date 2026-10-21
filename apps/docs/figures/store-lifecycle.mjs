export default {
  name: "store-lifecycle",
  width: 1040,
  height: 620,
  alt: "A Status transitions table for the Seller module listing each lifecycle workflow with the status it starts from, the status it sets, and the event it emits, with the terminate row highlighted because only a suspended or pending store can be terminated.",
  draw(f) {
    f.tiles({ seed: 19 })
    f.cascade({ x: 40, y: 130, w: 920, h: 451 }, [
      (p) => {
        p.header({ marker: "hi", title: "initech", tabs: ["Details", "Status", "Team"], active: 1, note: "sel_01JD8Q1234567" })
        p.table({
          y: 76,
          columns: [
            { label: "Field", w: 400 },
            { label: "Value", w: 456, align: "right" },
          ],
          rows: [
            ["status", "suspended"],
            ["status_reason", "Chargeback review"],
          ],
        })
      },
      (p) => {
        p.header({
          marker: "violet",
          title: "Status transitions",
          tabs: ["Workflows", "Events"],
          note: "SellerStatus",
        })
        p.table({
          y: 76,
          columns: [
            { label: "Workflow", w: 270 },
            { label: "From", w: 214 },
            { label: "To", w: 172 },
            { label: "Event", w: 200, align: "right" },
          ],
          rows: [
            ["approveSellerWorkflow", { chip: "Pending approval", tone: "amber" }, { chip: "Open", tone: "green" }, { text: "seller.approved", tone: "mid" }],
            ["suspendSellerWorkflow", { chip: "Open", tone: "green" }, { chip: "Suspended", tone: "red" }, { text: "seller.suspended", tone: "mid" }],
            ["unsuspendSellerWorkflow", { chip: "Suspended", tone: "red" }, { chip: "Open", tone: "green" }, { text: "seller.unsuspended", tone: "mid" }],
            {
              accent: true,
              cells: ["terminateSellerWorkflow", { chip: "Suspended", tone: "red" }, { chip: "Terminated", tone: "lo" }, { text: "seller.terminated", tone: "mid" }],
            },
            ["unterminateSellerWorkflow", { chip: "Terminated", tone: "lo" }, { chip: "Suspended", tone: "red" }, { text: "seller.unterminated", tone: "mid" }],
          ],
        })
      },
    ])
  },
}

export default {
  name: "payout-account-lifecycle",
  width: 1040,
  height: 600,
  alt: "A Stripe account.updated webhook behind the process-payout-for-webhook workflow. The workflow maps account.activated to the activate-payout-account step and the Active status, account.restricted to Restricted, account.rejected to Rejected, and not_supported to no change.",
  draw(f) {
    f.tiles({ seed: 5 })
    f.cascade({ x: 40, y: 168, w: 900, h: 386 }, [
      (p) => {
        p.header({ marker: "mid", title: "Stripe webhook", tabs: ["Event", "Headers"], note: "/hooks/payout" })
        p.table({
          y: 76,
          columns: [
            { label: "Field", w: 420 },
            { label: "Value", w: 416, align: "right" },
          ],
          rows: [
            ["type", "account.updated"],
            ["metadata.account_id", "pacc_01JD8Q1A"],
          ],
        })
      },
      (p) => {
        p.header({ marker: "violet", title: "process-payout-for-webhook", tabs: ["Accounts", "Payouts"], note: "when(action)" })
        p.table({
          y: 76,
          columns: [
            { label: "Action", w: 270 },
            { label: "Step", w: 330 },
            { label: "Status", w: 236, align: "right" },
          ],
          rows: [
            {
              accent: true,
              cells: ["account.activated", { text: "activate-payout-account", tone: "text" }, { chip: "Active", tone: "green" }],
            },
            ["account.restricted", { text: "restrict-payout-account", tone: "text" }, { chip: "Restricted", tone: "amber" }],
            ["account.rejected", { text: "reject-payout-account", tone: "text" }, { chip: "Rejected", tone: "red" }],
            [{ text: "not_supported", tone: "mid" }, { text: "no step", tone: "mid" }, { text: "unchanged", tone: "mid" }],
          ],
        })
      },
    ])
  },
}

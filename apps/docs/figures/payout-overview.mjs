export default {
  name: "payout-overview",
  width: 1040,
  height: 540,
  alt: "A Payouts list in front of a Payout accounts list. Payout #12 for ACME is accented: an order total of € 47.00 minus € 4.70 commission gives a € 42.30 payout, marked Paid. Behind it, ACME's payout account is Active and GLOBEX's is Restricted.",
  draw(f) {
    f.tiles({ seed: 7 })
    f.cascade({ x: 40, y: 168, w: 900, h: 322 }, [
      (p) => {
        p.header({ marker: "mid", title: "Payout accounts", tabs: ["Accounts", "Onboarding"], note: "seller_payout_account" })
        p.table({
          y: 76,
          columns: [
            { label: "Account", w: 300 },
            { label: "Store", w: 260 },
            { label: "Status", w: 276, align: "right" },
          ],
          rows: [
            ["pacc_01JD8Q1A", "ACME", { chip: "Active", tone: "green" }],
            ["pacc_01JD8Q2B", "GLOBEX", { chip: "Restricted", tone: "amber" }],
          ],
        })
      },
      (p) => {
        p.header({ marker: "violet", title: "Payouts", tabs: ["All", "Paid", "Failed"], note: "create-payout" })
        p.table({
          y: 76,
          columns: [
            { label: "Payout", w: 110 },
            { label: "Store", w: 130 },
            { label: "Order total", w: 150, align: "right" },
            { label: "Commission", w: 150, align: "right" },
            { label: "Amount", w: 130, align: "right" },
            { label: "Status", w: 166, align: "right" },
          ],
          rows: [
            {
              accent: true,
              cells: ["#12", "ACME", "€ 47.00", { text: "€ 4.70", tone: "mid" }, "€ 42.30", { chip: "Paid", tone: "green" }],
            },
            ["#11", "GLOBEX", "€ 40.00", { text: "€ 4.00", tone: "mid" }, "€ 36.00", { chip: "Pending", tone: "amber" }],
            ["#10", "ACME", "€ 21.00", { text: "€ 2.10", tone: "mid" }, "€ 18.90", { chip: "Failed", tone: "red" }],
          ],
        })
      },
    ])
  },
}

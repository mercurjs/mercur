import { PayoutStatus } from "@mercurjs/types"

import { SettlementLineType, SettlementStatus } from "../../../../types/common"
import { buildSettlement } from "../settlement-builder"

const periodEnd = new Date("2026-10-22T01:03:00Z")
const inside = new Date("2026-10-21T14:12:00Z")
const line = (id: string, type: SettlementLineType, amount: number, paid_at: Date = inside) => ({
  id,
  type,
  amount,
  paid_at,
})
const account = { payouts_enabled: true, seller_id: "sel_1" }

describe("buildSettlement", () => {
  it("nets payouts, reversals and adjustments paid up to the window end", () => {
    const totals = buildSettlement(
      [
        line("p1", SettlementLineType.PAYOUT, 162),
        line("r1", SettlementLineType.REVERSAL, 54),
        line("a1", SettlementLineType.ADJUSTMENT_DEBIT, 29),
        line("a2", SettlementLineType.ADJUSTMENT_CREDIT, 5),
        line("p2", SettlementLineType.PAYOUT, 999, new Date("2026-10-23T00:00:00Z")),
      ],
      periodEnd,
      account
    )
    expect(Number(totals.payouts_total)).toBe(162)
    expect(Number(totals.reversals_total)).toBe(54)
    expect(Number(totals.adjustments_total)).toBe(-24)
    expect(Number(totals.amount)).toBe(84)
    expect(totals.lines.map((l) => l.id)).toEqual(["p1", "r1", "a1", "a2"])
    expect(totals.status).toBe(SettlementStatus.OPEN)
    expect(totals.payout_status).toBe(PayoutStatus.PENDING)
  })

  it("aborts a non-positive window", () => {
    const totals = buildSettlement(
      [line("p1", SettlementLineType.PAYOUT, 10), line("r1", SettlementLineType.REVERSAL, 10)],
      periodEnd,
      account
    )
    expect(totals.status).toBe(SettlementStatus.ABORTED)
    expect(totals.payout_status).toBeNull()
    expect(totals.payout_reason).toBe("invalid_amount")
  })

  it("holds the payout when payouts are disabled", () => {
    const totals = buildSettlement([line("p1", SettlementLineType.PAYOUT, 10)], periodEnd, {
      ...account,
      payouts_enabled: false,
    })
    expect(totals.payout_status).toBe(PayoutStatus.ON_HOLD)
    expect(totals.payout_reason).toBe("account_payouts_disabled")
  })
})

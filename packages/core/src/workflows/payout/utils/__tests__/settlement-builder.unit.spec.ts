import { PayoutStatus, SettlementStatus, TransferStatus, TransferType } from "@mercurjs/types"

import { buildSettlement } from "../settlement-builder"

const window = { period_start: new Date("2026-10-21T01:03:00Z"), period_end: new Date("2026-10-22T01:03:00Z") }
const inside = new Date("2026-10-21T14:12:00Z")
const line = (id: string, type: TransferType, amount: number, overrides: Partial<{ status: TransferStatus; updated_at: Date }> = {}) => ({
  id,
  type,
  status: TransferStatus.CREATED,
  amount,
  currency_code: "eur",
  updated_at: inside,
  ...overrides,
})
const account = { payouts_enabled: true, ignored: false, seller_id: "sel_1" }

describe("buildSettlement", () => {
  it("nets transfers, reversals and adjustments that reached created in the window", () => {
    const totals = buildSettlement(
      [
        line("t1", TransferType.ORDER, 162),
        line("t2", TransferType.REFUND_REVERSAL, 54),
        line("t3", TransferType.ADJUSTMENT_DEBIT, 29),
        line("t4", TransferType.ORDER, 999, { status: TransferStatus.ON_HOLD }),
        line("t5", TransferType.ORDER, 999, { updated_at: new Date("2026-10-20T00:00:00Z") }),
      ],
      window,
      account
    )
    expect(Number(totals.transfers_total)).toBe(162)
    expect(Number(totals.reversals_total)).toBe(54)
    expect(Number(totals.adjustments_total)).toBe(-29)
    expect(Number(totals.amount)).toBe(79)
    expect(totals.transfer_ids).toEqual(["t1", "t2", "t3"])
    expect(totals.status).toBe(SettlementStatus.OPEN)
    expect(totals.payout_status).toBe(PayoutStatus.PENDING)
  })

  it("aborts a non-positive window", () => {
    const totals = buildSettlement([line("t1", TransferType.ORDER, 10), line("t2", TransferType.REFUND_REVERSAL, 10)], window, account)
    expect(totals.status).toBe(SettlementStatus.ABORTED)
    expect(totals.payout_status).toBeNull()
    expect(totals.payout_reason).toBe("Amount must be positive, input was: 0")
  })

  it("holds the payout when payouts are disabled", () => {
    const totals = buildSettlement([line("t1", TransferType.ORDER, 10)], window, { ...account, payouts_enabled: false })
    expect(totals.payout_status).toBe(PayoutStatus.ON_HOLD)
    expect(totals.payout_reason).toBe("Payouts are disabled for seller sel_1")
  })

  it("counts the boundary as in the next window", () => {
    const totals = buildSettlement([line("t1", TransferType.ORDER, 10, { updated_at: window.period_start })], window, account)
    expect(totals.transfer_ids).toEqual([])
  })
})

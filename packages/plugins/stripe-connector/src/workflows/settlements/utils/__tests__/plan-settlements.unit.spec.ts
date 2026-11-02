import { PayoutStatus } from "@mercurjs/types"

import { SettlementLineType, SettlementStatus } from "../../../../types/common"
import { PreviousSettlement, SettlementSource, planSettlements, unsettledSince } from "../plan-settlements"

const now = new Date("2026-10-28T01:00:00.000Z")

const source = (overrides: Partial<SettlementSource> = {}): SettlementSource => ({
  account: { id: "pacc_1", external_id: "acct_1", payouts_enabled: true, created_at: "2026-10-01T00:00:00.000Z" },
  seller_id: "sel_1",
  previous: [],
  lines: [
    { id: "pout_1", type: SettlementLineType.PAYOUT, amount: 100, paid_at: "2026-10-27T10:00:00.000Z", currency_code: "eur" },
    { id: "adj_1", type: SettlementLineType.ADJUSTMENT_DEBIT, amount: 10, paid_at: "2026-10-27T11:00:00.000Z", currency_code: "eur" },
  ],
  ...overrides,
})

const previous = (overrides: Partial<PreviousSettlement>): PreviousSettlement => ({
  currency_code: "eur",
  period_start: "2026-10-26T01:00:00.000Z",
  period_end: "2026-10-27T01:00:00.000Z",
  status: SettlementStatus.PAID_OUT,
  payout_status: PayoutStatus.PAID,
  provider_payout_id: "po_1",
  ...overrides,
})

describe("planSettlements", () => {
  it("nets an account's lines per currency from the previous period end", () => {
    const plan = planSettlements([source({ previous: [previous({})] })], now, "plugin")
    expect(plan.settlements).toHaveLength(1)
    expect(plan.settlements[0]).toMatchObject({
      currency_code: "eur",
      period_start: new Date("2026-10-27T01:00:00.000Z"),
      amount: 90,
      status: SettlementStatus.OPEN,
      payout_status: PayoutStatus.PENDING,
    })
    expect(plan.settlements[0].lines).toEqual([
      { type: SettlementLineType.PAYOUT, amount: 100, payout_id: "pout_1", payout_reversal_id: null, adjustment_id: null },
      { type: SettlementLineType.ADJUSTMENT_DEBIT, amount: 10, payout_id: null, payout_reversal_id: null, adjustment_id: "adj_1" },
    ])
  })

  it("blocks a currency whose previous bank payout has no outcome yet", () => {
    const unanswered = previous({ status: SettlementStatus.OPEN, payout_status: PayoutStatus.PROCESSING, provider_payout_id: null })
    expect(planSettlements([source({ previous: [unanswered] })], now, "plugin").counts.blocked).toBe(1)

    const accepted = previous({ status: SettlementStatus.OPEN, payout_status: PayoutStatus.PROCESSING })
    expect(planSettlements([source({ previous: [accepted] })], now, "plugin").settlements).toHaveLength(1)

    const failed = previous({ status: SettlementStatus.FAILED, payout_status: PayoutStatus.ON_HOLD, provider_payout_id: null })
    expect(planSettlements([source({ previous: [failed] })], now, "plugin").counts.blocked).toBe(1)
  })

  it("records provider-mode settlements as paid out", () => {
    const [settlement] = planSettlements([source()], now, "provider").settlements
    expect(settlement).toMatchObject({ status: SettlementStatus.PAID_OUT, payout_status: PayoutStatus.PAID })
  })

  it("looks for unsettled lines from the oldest latest window across currencies", () => {
    expect(unsettledSince([])).toBeNull()
    expect(
      unsettledSince([
        previous({ period_start: "2026-10-26T01:00:00.000Z", period_end: "2026-10-27T01:00:00.000Z" }),
        previous({ period_start: "2026-10-25T01:00:00.000Z", period_end: "2026-10-26T01:00:00.000Z" }),
        previous({ currency_code: "usd", period_start: "2026-10-20T01:00:00.000Z", period_end: "2026-10-21T01:00:00.000Z" }),
      ])
    ).toEqual(new Date("2026-10-20T01:00:00.000Z"))
  })
})

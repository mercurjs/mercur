import { PayoutStatus } from "@mercurjs/types"

import { fulfillmentReached } from "../fulfillment-status"
import { decideOrderPayout, decideReversal } from "../payout-amounts"

const order = (overrides: Partial<Parameters<typeof decideOrderPayout>[0]["order"]> = {}) => ({
  id: "order_1",
  seller_id: "sel_1",
  status: "pending",
  canceled_at: null,
  fulfillment_status: "fulfilled",
  total: 180,
  currency_code: "eur",
  created_at: new Date("2026-10-21T14:12:00Z"),
  ...overrides,
})

const account = { id: "pacc_1", payouts_enabled: true }
const payment = {
  id: "pay_1",
  captured: true,
  canceled: false,
  fully_refunded: false,
  data: { id: "pi_1", latest_charge: "ch_1" },
}

const base = {
  order: order(),
  account,
  payment,
  commission_total: 18,
  required_fulfillment_status: "fulfilled" as const,
}

describe("decideOrderPayout", () => {
  it("holds when the seller has no account", () => {
    const decision = decideOrderPayout({ ...base, account: null })
    expect(decision.status).toBe(PayoutStatus.ON_HOLD)
    expect(decision.status_reason).toBe("Cannot find payout account for seller sel_1")
  })

  it("holds when payouts are disabled on the account", () => {
    const decision = decideOrderPayout({ ...base, account: { ...account, payouts_enabled: false } })
    expect(decision.status).toBe(PayoutStatus.ON_HOLD)
  })

  it("aborts a canceled order", () => {
    const decision = decideOrderPayout({ ...base, order: order({ status: "canceled" }) })
    expect(decision.status).toBe(PayoutStatus.ABORTED)
    expect(decision.status_reason).toBe("Order cannot be processed, status is canceled")
  })

  it("holds an order below the required fulfillment status", () => {
    const decision = decideOrderPayout({ ...base, order: order({ fulfillment_status: "partially_fulfilled" }) })
    expect(decision.status).toBe(PayoutStatus.ON_HOLD)
    expect(decision.status_reason).toBe("Order is not ready yet, status is partially_fulfilled")
  })

  it("holds an authorized but uncaptured payment", () => {
    const decision = decideOrderPayout({ ...base, payment: { ...payment, captured: false } })
    expect(decision.status).toBe(PayoutStatus.ON_HOLD)
    expect(decision.status_reason).toBe("Payment pay_1 is not ready yet, status is authorized")
  })

  it("aborts a canceled or fully refunded payment", () => {
    expect(decideOrderPayout({ ...base, payment: { ...payment, canceled: true } }).status).toBe(PayoutStatus.ABORTED)
    expect(decideOrderPayout({ ...base, payment: { ...payment, fully_refunded: true } }).status).toBe(PayoutStatus.ABORTED)
  })

  it("aborts when total minus commission is not positive", () => {
    const decision = decideOrderPayout({ ...base, commission_total: 180 })
    expect(decision.status).toBe(PayoutStatus.ABORTED)
    expect(decision.status_reason).toBe("Amount must be positive, input was: 0")
  })

  it("is pending for total minus commission", () => {
    const decision = decideOrderPayout(base)
    expect(decision.status).toBe(PayoutStatus.PENDING)
    expect(Number(decision.amount)).toBe(162)
  })

})

describe("fulfillmentReached", () => {
  it("walks the ordered scale and never counts canceled", () => {
    expect(fulfillmentReached("shipped", "fulfilled")).toBe(true)
    expect(fulfillmentReached("not_fulfilled", "fulfilled")).toBe(false)
    expect(fulfillmentReached("canceled", "not_fulfilled")).toBe(false)
  })
})

describe("decideReversal", () => {
  const payout = { id: "pout_1", status: PayoutStatus.PAID, provider_payout_id: "tr_1" }

  it("reverses the refund net of its commission share", () => {
    const decision = decideReversal({
      refund_id: "ref_1",
      refund_amount: 60,
      refund_canceled: false,
      order_total: 180,
      commission_total: 18,
      payout,
    })
    expect(decision.status).toBe(PayoutStatus.PENDING)
    expect(Number(decision.amount)).toBe(54)
  })

  it("holds until the order payout is paid", () => {
    const decision = decideReversal({
      refund_id: "ref_1",
      refund_amount: 60,
      refund_canceled: false,
      order_total: 180,
      commission_total: 18,
      payout: { ...payout, status: PayoutStatus.ON_HOLD, provider_payout_id: null },
    })
    expect(decision.status).toBe(PayoutStatus.ON_HOLD)
  })

  it("aborts when the order payout was aborted", () => {
    const decision = decideReversal({
      refund_id: "ref_1",
      refund_amount: 60,
      refund_canceled: false,
      order_total: 180,
      commission_total: 18,
      payout: { ...payout, status: PayoutStatus.ABORTED },
    })
    expect(decision.status).toBe(PayoutStatus.ABORTED)
    expect(decision.status_reason).toBe("Refund ref_1 has been aborted")
  })
})

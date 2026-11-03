import { PayoutStatus, PayoutStatusReason } from "@mercurjs/types"

import { fulfillmentReached } from "../fulfillment-status"
import { capturedNetOf, decideOrderPayout, decideReversal, grossTotalOf, planOrderPayouts } from "../payout-amounts"
import { sentToProvider } from "../sent-to-provider"

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
    expect(decision.status_reason).toBe(PayoutStatusReason.ACCOUNT_NOT_READY)
    expect(decision.status_detail).toBe("Cannot find payout account for seller sel_1")
  })

  it("holds when payouts are disabled on the account", () => {
    const decision = decideOrderPayout({ ...base, account: { ...account, payouts_enabled: false } })
    expect(decision.status).toBe(PayoutStatus.ON_HOLD)
    expect(decision.status_reason).toBe(PayoutStatusReason.ACCOUNT_PAYOUTS_DISABLED)
  })

  it("aborts a canceled order", () => {
    const decision = decideOrderPayout({ ...base, order: order({ status: "canceled" }) })
    expect(decision.status).toBe(PayoutStatus.ABORTED)
    expect(decision.status_reason).toBe(PayoutStatusReason.ORDER_ABORTED)
    expect(decision.status_detail).toBe("Order cannot be processed, status is canceled")
  })

  it("aborts a canceled order even when the seller has no usable account", () => {
    expect(decideOrderPayout({ ...base, account: null, order: order({ status: "canceled" }) }).status).toBe(
      PayoutStatus.ABORTED
    )
    expect(
      decideOrderPayout({
        ...base,
        account: { ...account, payouts_enabled: false },
        order: order({ canceled_at: new Date() }),
      }).status
    ).toBe(PayoutStatus.ABORTED)
  })

  it("holds an order below the required fulfillment status", () => {
    const decision = decideOrderPayout({ ...base, order: order({ fulfillment_status: "partially_fulfilled" }) })
    expect(decision.status).toBe(PayoutStatus.ON_HOLD)
    expect(decision.status_reason).toBe(PayoutStatusReason.ORDER_NOT_READY)
    expect(decision.status_detail).toBe("Order is not ready yet, status is partially_fulfilled")
  })

  it("holds an authorized but uncaptured payment", () => {
    const decision = decideOrderPayout({ ...base, payment: { ...payment, captured: false } })
    expect(decision.status).toBe(PayoutStatus.ON_HOLD)
    expect(decision.status_reason).toBe(PayoutStatusReason.PAYMENT_NOT_READY)
    expect(decision.status_detail).toBe("Payment pay_1 is not ready yet, status is authorized")
  })

  it("aborts a canceled or fully refunded payment", () => {
    expect(decideOrderPayout({ ...base, payment: { ...payment, canceled: true } }).status).toBe(PayoutStatus.ABORTED)
    expect(decideOrderPayout({ ...base, payment: { ...payment, fully_refunded: true } }).status).toBe(PayoutStatus.ABORTED)
  })

  it("aborts when total minus commission is not positive", () => {
    const decision = decideOrderPayout({ ...base, commission_total: 180 })
    expect(decision.status).toBe(PayoutStatus.ABORTED)
    expect(decision.status_reason).toBe(PayoutStatusReason.INVALID_AMOUNT)
    expect(decision.status_detail).toBe("Amount must be positive, input was: 0")
  })

  it("rounds the payout to the currency precision", () => {
    const decision = decideOrderPayout({ ...base, order: order({ total: 265.5 }), commission_total: 18.375 })
    expect(Number(decision.amount)).toBe(247.13)
  })

  it("is pending for total minus commission", () => {
    const decision = decideOrderPayout(base)
    expect(decision.status).toBe(PayoutStatus.PENDING)
    expect(decision.status_reason).toBeNull()
    expect(Number(decision.amount)).toBe(162)
  })

  it("caps the payout at what was captured when the total outgrew the payment", () => {
    const decision = decideOrderPayout({ ...base, order: order({ total: 400 }), captured_total: 180 })
    expect(decision.status).toBe(PayoutStatus.PENDING)
    expect(Number(decision.amount)).toBe(162)
  })

  it("keeps total minus commission when the capture covers it", () => {
    expect(Number(decideOrderPayout({ ...base, captured_total: 180 }).amount)).toBe(162)
    expect(Number(decideOrderPayout({ ...base, captured_total: 250 }).amount)).toBe(162)
  })

  it("ignores an unknown or empty capture amount", () => {
    expect(Number(decideOrderPayout({ ...base, captured_total: null }).amount)).toBe(162)
    expect(Number(decideOrderPayout({ ...base, captured_total: 0 }).amount)).toBe(162)
  })

})

describe("capturedNetOf", () => {
  it("sums captures minus refunds on live payments only", () => {
    const captured = capturedNetOf({
      payment_collections: [
        {
          payments: [
            {
              id: "pay_1",
              captured_at: new Date(),
              canceled_at: null,
              data: null,
              amount: 180,
              captures: [{ amount: 100 }, { amount: 80 }],
              refunds: [{ id: "ref_1", amount: 30 }],
            },
            {
              id: "pay_2",
              captured_at: new Date(),
              canceled_at: new Date(),
              data: null,
              amount: 50,
              captures: [{ amount: 50 }],
            },
          ],
        },
      ],
    })
    expect(Number(captured)).toBe(150)
  })
})

describe("planOrderPayouts", () => {
  const payoutOrder = (total: number) => ({
    id: "order_1",
    status: "pending",
    canceled_at: null,
    total,
    currency_code: "eur",
    items: [{ id: "item_1", quantity: 1 }],
    fulfillments: [{ canceled_at: null, shipped_at: null, delivered_at: null, items: [{ line_item_id: "item_1", quantity: 1 }] }],
    shipping_methods: [],
    seller: { id: "sel_1", payout_account: { id: "pacc_1", payouts_enabled: true } },
    payment_collections: [
      {
        payments: [
          { id: "pay_1", captured_at: new Date(), canceled_at: null, data: {}, amount: 180, captures: [{ amount: 180 }], refunds: [] },
        ],
      },
    ],
  })

  it("never pays out more than the captured amount minus commission", () => {
    const plan = planOrderPayouts({
      orders: [payoutOrder(400) as unknown as Parameters<typeof planOrderPayouts>[0]["orders"][number]],
      commission_lines: [{ amount: 18, item_id: "item_1" }],
      payouts: [],
      required_fulfillment_status: "fulfilled",
    })
    expect(plan.create).toHaveLength(1)
    expect(plan.create[0].status).toBe(PayoutStatus.PENDING)
    expect(plan.create[0].amount).toBe(162)
  })
})

describe("grossTotalOf", () => {
  it("adds refund credit lines back and leaves store credit deducted", () => {
    const gross = grossTotalOf({
      total: 100,
      credit_lines: [
        { amount: 30, reference: "payment_collection" },
        { amount: 25, reference: "store_credit" },
        { amount: 10, reference: null },
      ],
    })
    expect(Number(gross)).toBe(130)
  })

  it("is the total when nothing was refunded", () => {
    expect(Number(grossTotalOf({ total: 100, credit_lines: [] }))).toBe(100)
    expect(Number(grossTotalOf({ total: 100 }))).toBe(100)
  })
})

describe("planOrderPayouts credit lines", () => {
  const payoutOrder = (creditLines: { amount: number; reference: string | null }[]) => ({
    id: "order_1",
    status: "pending",
    canceled_at: null,
    total: 100,
    currency_code: "eur",
    credit_lines: creditLines,
    items: [{ id: "item_1", quantity: 1 }],
    shipping_methods: [],
    fulfillments: [
      { canceled_at: null, shipped_at: null, delivered_at: null, items: [{ line_item_id: "item_1", quantity: 1 }] },
    ],
    seller: { id: "sel_1", payout_account: { id: "pacc_1", payouts_enabled: true } },
    payment_collections: [
      {
        payments: [
          {
            id: "pay_1",
            amount: 100,
            captured_at: new Date(),
            canceled_at: null,
            data: {},
            captures: [{ amount: 100 }],
            refunds: [],
          },
        ],
      },
    ],
  })

  it("pays the order total net of store credit, minus commission", () => {
    const plan = planOrderPayouts({
      orders: [payoutOrder([{ amount: 40, reference: "store_credit" }])],
      commission_lines: [{ amount: 10, item_id: "item_1" }],
      payouts: [],
      required_fulfillment_status: "fulfilled",
    })
    expect(plan.create).toHaveLength(1)
    expect(plan.create[0].status).toBe(PayoutStatus.PENDING)
    expect(plan.create[0].amount).toBe(90)
  })

  it("keeps a refund that landed before the payout out of the amount", () => {
    const order = payoutOrder([{ amount: 20, reference: "payment_collection" }])
    const payment = order.payment_collections[0].payments[0]
    payment.amount = 120
    payment.captures = [{ amount: 120 }]
    payment.refunds = [{ id: "ref_1", amount: 20 }]
    const plan = planOrderPayouts({
      orders: [order],
      commission_lines: [{ amount: 12, item_id: "item_1" }],
      payouts: [],
      required_fulfillment_status: "fulfilled",
    })
    expect(plan.create[0].amount).toBe(90)
    expect(plan.create[0].data.absorbed_refund_ids).toEqual(["ref_1"])
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

  it("rounds the reversal to the currency precision", () => {
    const decision = decideReversal({
      refund_id: "ref_1",
      refund_amount: 60.05,
      refund_canceled: false,
      order_total: 180,
      commission_total: 18,
      currency_code: "eur",
      payout,
    })
    expect(Number(decision.amount)).toBe(54.05)
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
    expect(decision.status_reason).toBe(PayoutStatusReason.PAYOUT_NOT_READY)
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
    expect(decision.status_reason).toBe(PayoutStatusReason.REFUND_ABORTED)
    expect(decision.status_detail).toBe("Refund ref_1 has been aborted")
  })
})

describe("sentToProvider", () => {
  it("counts a processing or paid row as sent", () => {
    expect(sentToProvider({ status: PayoutStatus.PROCESSING })).toBe(true)
    expect(sentToProvider({ status: PayoutStatus.PAID })).toBe(true)
  })

  it("counts a failed row as sent when it was attempted after the snapshot", () => {
    expect(sentToProvider({ status: PayoutStatus.FAILED, data: { attempts: 1 } })).toBe(true)
    expect(sentToProvider({ status: PayoutStatus.FAILED, data: { attempts: 2 } }, { data: { attempts: 1 } })).toBe(true)
  })

  it("leaves a row that never reached the provider restorable", () => {
    expect(sentToProvider({ status: PayoutStatus.PENDING, data: {} })).toBe(false)
    expect(sentToProvider({ status: PayoutStatus.ON_HOLD, data: { attempts: 1 } }, { data: { attempts: 1 } })).toBe(false)
  })
})

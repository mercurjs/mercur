import { MathBN } from "@medusajs/framework/utils"

import {
  allocateProportionally,
  getOrderCapturedBalance,
} from "../split-order-payment"
import {
  buildSplitOrderCaptureTransactions,
  getSplitOrderCaptureAmount,
  SplitOrderPaymentContext,
  SplitOrderSnapshot,
} from "../split-order-payment-context"

const toNumbers = (values: { toNumber(): number }[]) =>
  values.map((value) => value.toNumber())

const order = (
  id: string,
  total: number,
  overrides: Partial<SplitOrderSnapshot> = {}
): SplitOrderSnapshot => ({
  id,
  status: "pending",
  canceled_at: null,
  currency_code: "usd",
  total,
  transactions: [],
  ...overrides,
})

const context = (
  orders: SplitOrderSnapshot[],
  captures: { id: string; amount: number }[] = [],
  amount = 200
): SplitOrderPaymentContext => ({
  is_split: true,
  payment_collection_id: "pay_col_1",
  payments: [
    {
      id: "pay_1",
      currency_code: "usd",
      amount,
      payment_collection_id: "pay_col_1",
      captures,
      refunds: [],
    },
  ],
  orders,
})

describe("allocateProportionally", () => {
  it("splits by weight", () => {
    const shares = allocateProportionally({
      amount: 200,
      weights: [98, 102],
      decimalDigits: 2,
    })

    expect(toNumbers(shares)).toEqual([98, 102])
  })

  it("rounds to the currency precision and still sums to the amount", () => {
    const shares = allocateProportionally({
      amount: 100,
      weights: [1, 1, 1],
      decimalDigits: 2,
    })

    expect(toNumbers(shares)).toEqual([33.34, 33.33, 33.33])
    expect(MathBN.sum(...shares).toNumber()).toEqual(100)
  })

  it("gives the leftover units to the largest fractions", () => {
    const shares = allocateProportionally({
      amount: 10,
      weights: [1, 5, 1],
      decimalDigits: 0,
    })

    expect(toNumbers(shares)).toEqual([2, 7, 1])
  })

  it("never allocates more than the amount when it is below the weights", () => {
    const shares = allocateProportionally({
      amount: 150,
      weights: [98, 102],
      decimalDigits: 2,
    })

    expect(toNumbers(shares)).toEqual([73.5, 76.5])
  })

  it("keeps a sub-unit remainder instead of dropping it", () => {
    const shares = allocateProportionally({
      amount: 62.8900001255,
      weights: [1, 1],
      decimalDigits: 2,
    })

    expect(MathBN.sum(...shares).toNumber()).toEqual(62.8900001255)
  })

  it("splits evenly when every weight is zero", () => {
    const shares = allocateProportionally({
      amount: 10,
      weights: [0, 0],
      decimalDigits: 2,
    })

    expect(toNumbers(shares)).toEqual([5, 5])
  })
})

describe("getOrderCapturedBalance", () => {
  const transactions = [
    { reference: "capture", reference_id: "capt_1", amount: 98 },
    { reference: "refund", reference_id: "ref_1", amount: -20 },
    { reference: "capture", reference_id: "capt_other", amount: 5 },
    { reference: "credit_line", reference_id: "cl_1", amount: 50 },
  ]

  it("nets captures against refunds and ignores other references", () => {
    expect(getOrderCapturedBalance(transactions).toNumber()).toEqual(83)
  })

  it("counts only the given payment's movements", () => {
    const balance = getOrderCapturedBalance(transactions, {
      captures: [{ id: "capt_1" }],
      refunds: [{ id: "ref_1" }],
    })

    expect(balance.toNumber()).toEqual(78)
  })
})

describe("buildSplitOrderCaptureTransactions", () => {
  it("shares a capture between the orders by what they owe", () => {
    const transactions = buildSplitOrderCaptureTransactions(
      context([order("order_a", 98), order("order_b", 102)], [
        { id: "capt_1", amount: 200 },
      ])
    )

    expect(
      transactions.map((t) => [t.order_id, MathBN.convert(t.amount).toNumber()])
    ).toEqual([
      ["order_a", 98],
      ["order_b", 102],
    ])
  })

  it("skips captures an order already recorded", () => {
    const transactions = buildSplitOrderCaptureTransactions(
      context(
        [
          order("order_a", 98, {
            transactions: [
              { reference: "capture", reference_id: "capt_1", amount: 98 },
            ],
          }),
          order("order_b", 102, {
            transactions: [
              { reference: "capture", reference_id: "capt_1", amount: 102 },
            ],
          }),
        ],
        [{ id: "capt_1", amount: 200 }]
      )
    )

    expect(transactions).toEqual([])
  })

  it("leaves canceled orders out of a capture", () => {
    const transactions = buildSplitOrderCaptureTransactions(
      context(
        [order("order_a", 98, { status: "canceled" }), order("order_b", 102)],
        [{ id: "capt_1", amount: 102 }]
      )
    )

    expect(
      transactions.map((t) => [t.order_id, MathBN.convert(t.amount).toNumber()])
    ).toEqual([["order_b", 102]])
  })

  it("spreads consecutive partial captures without exceeding an order total", () => {
    const transactions = buildSplitOrderCaptureTransactions(
      context([order("order_a", 98), order("order_b", 102)], [
        { id: "capt_1", amount: 100 },
        { id: "capt_2", amount: 100 },
      ])
    )

    const totalFor = (orderId: string) =>
      MathBN.sum(
        ...transactions.filter((t) => t.order_id === orderId).map((t) => t.amount)
      ).toNumber()

    expect(totalFor("order_a")).toEqual(98)
    expect(totalFor("order_b")).toEqual(102)
  })

  it("records nothing for a collection linked directly to an order", () => {
    const linked = {
      ...context([order("order_a", 98)], [{ id: "capt_1", amount: 98 }]),
      is_split: false,
    }

    expect(buildSplitOrderCaptureTransactions(linked)).toEqual([])
  })
})

describe("getSplitOrderCaptureAmount", () => {
  it("keeps an explicit amount", () => {
    const ctx = context([order("order_a", 98), order("order_b", 102)])

    expect(getSplitOrderCaptureAmount(ctx, "pay_1", 50)).toEqual(50)
  })

  it("captures the whole authorization while every order is open", () => {
    const ctx = context([order("order_a", 98), order("order_b", 102)])

    expect(getSplitOrderCaptureAmount(ctx, "pay_1")).toBeUndefined()
  })

  it("leaves a canceled order's share uncaptured", () => {
    const ctx = context([
      order("order_a", 98, { status: "canceled" }),
      order("order_b", 102),
    ])

    expect(getSplitOrderCaptureAmount(ctx, "pay_1")).toEqual(102)
  })
})

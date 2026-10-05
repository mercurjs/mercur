import { MathBN } from "@medusajs/framework/utils"

import { allocateProportionally } from "../split-order-payment"
import {
  planCartPaymentSplit,
  planCartPaymentVoid,
  resolveOrderPaymentCollections,
  SplitOrderGroupCollection,
  SplitOrderGroupOrder,
} from "../split-order-payment-group"

const toNumbers = (values: { toNumber(): number }[]) =>
  values.map((value) => value.toNumber())

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

  it("splits evenly when every weight is zero", () => {
    const shares = allocateProportionally({
      amount: 10,
      weights: [0, 0],
      decimalDigits: 2,
    })

    expect(toNumbers(shares)).toEqual([5, 5])
  })
})

describe("resolveOrderPaymentCollections", () => {
  const own = { id: "pay_col_order" }

  it("uses the order's own collections once the cart payment is split", () => {
    const collections = resolveOrderPaymentCollections({
      payment_collections: [own],
      cart: {
        payment_collection: { metadata: { split_order_collections: true } },
      },
    })

    expect(collections).toEqual([own])
  })

  it("keeps the cart collection for an order that never got its own", () => {
    const shared = {
      id: "pay_col_cart",
      metadata: { split_order_collections: true },
    }

    expect(
      resolveOrderPaymentCollections({
        payment_collections: [],
        cart: { payment_collection: shared },
      })
    ).toEqual([shared])
  })

  it("uses the cart collection until the cart payment is split", () => {
    const shared = { id: "pay_col_cart", metadata: null }

    expect(
      resolveOrderPaymentCollections({
        payment_collections: [],
        cart: { payment_collection: shared },
      })
    ).toEqual([shared])
  })

  it("uses the linked collections when the cart is not loaded", () => {
    expect(
      resolveOrderPaymentCollections({ payment_collections: [own] })
    ).toEqual([own])
  })
})

const cartCollection = (
  captures: number[],
  overrides: Partial<SplitOrderGroupCollection> = {}
): SplitOrderGroupCollection => ({
  id: "pay_col_cart",
  currency_code: "usd",
  metadata: null,
  payments: [
    {
      id: "pay_cart",
      provider_id: "pp_stripe_stripe",
      currency_code: "usd",
      amount: 200,
      data: { id: "pi_123" },
      captures: captures.map((amount, index) => ({
        id: `capt_cart_${index}`,
        amount,
      })),
      refunds: [],
    },
  ],
  ...overrides,
})

const order = (
  id: string,
  total: number,
  overrides: Partial<SplitOrderGroupOrder> = {}
): SplitOrderGroupOrder => ({
  id,
  status: "pending",
  canceled_at: null,
  total,
  payment_collections: [],
  ...overrides,
})

const splitOrder = (id: string, total: number, captured: number) =>
  order(id, total, {
    payment_collections: [
      {
        id: `pay_col_${id}`,
        currency_code: "usd",
        metadata: { cart_payment_collection_id: "pay_col_cart" },
        payments: [
          {
            id: `pay_${id}`,
            provider_id: "pp_stripe_stripe",
            currency_code: "usd",
            amount: total,
            captures: [{ id: `capt_${id}`, amount: captured }],
            refunds: [],
          },
        ],
      },
    ],
  })

const amountsOf = (rows: { amount: unknown }[]) =>
  rows.map((row) => MathBN.convert(row.amount as number).toNumber())

describe("planCartPaymentSplit", () => {
  it("plans nothing before the cart payment is captured", () => {
    const plan = planCartPaymentSplit(cartCollection([]), [
      order("order_a", 98),
      order("order_b", 102),
    ])

    expect(plan.collections).toEqual([])
    expect(plan.captures).toEqual([])
  })

  it("gives every order a collection, a payment and a capture for its share", () => {
    const plan = planCartPaymentSplit(cartCollection([200]), [
      order("order_a", 98),
      order("order_b", 102),
    ])

    expect(amountsOf(plan.collections)).toEqual([98, 102])
    expect(plan.payments.map((p) => p.provider_id)).toEqual([
      "pp_stripe_stripe",
      "pp_stripe_stripe",
    ])
    expect(plan.payments[0].data).toEqual({ id: "pi_123" })
    expect(amountsOf(plan.captures)).toEqual([98, 102])
    expect(plan.refunds).toEqual([])
    expect(plan.cart_payment_collection?.metadata).toEqual({
      split_order_collections: true,
    })
  })

  it("plans nothing new for a cart that is already split", () => {
    const plan = planCartPaymentSplit(
      cartCollection([200], { metadata: { split_order_collections: true } }),
      [splitOrder("order_a", 98, 98), splitOrder("order_b", 102, 102)]
    )

    expect(plan.collections).toEqual([])
    expect(plan.payments).toEqual([])
    expect(plan.captures).toEqual([])
    expect(plan.refunds).toEqual([])
    expect(plan.cart_payment_collection).toBeUndefined()
    expect(plan.recorded.map((c) => c.capture_id)).toEqual([
      "capt_order_a",
      "capt_order_b",
    ])
  })

  it("refunds the share of an order canceled before the capture", () => {
    const plan = planCartPaymentSplit(cartCollection([200]), [
      order("order_a", 98, { status: "canceled" }),
      order("order_b", 102),
    ])

    expect(plan.collections.map((c) => c.order_id)).toEqual(["order_b"])
    expect(amountsOf(plan.captures)).toEqual([102])
    expect(plan.refunds.map((r) => r.payment_id)).toEqual(["pay_cart"])
    expect(amountsOf(plan.refunds)).toEqual([98])
  })

  it("reuses a collection left without a payment", () => {
    const plan = planCartPaymentSplit(cartCollection([200]), [
      order("order_a", 98, {
        payment_collections: [
          {
            id: "pay_col_order_a",
            currency_code: "usd",
            metadata: { cart_payment_collection_id: "pay_col_cart" },
            payments: [],
          },
        ],
      }),
      order("order_b", 102),
    ])

    expect(plan.collections.map((c) => c.order_id)).toEqual(["order_b"])
    expect(plan.payments.map((p) => p.payment_collection_id)).toEqual([
      "pay_col_order_a",
      undefined,
    ])
  })

  it("adds only what a later partial capture brings", () => {
    const plan = planCartPaymentSplit(
      cartCollection([100, 100], {
        metadata: { split_order_collections: true },
      }),
      [splitOrder("order_a", 98, 49), splitOrder("order_b", 102, 51)]
    )

    expect(plan.payments).toEqual([])
    expect(plan.captures.map((c) => c.payment_id)).toEqual([
      "pay_order_a",
      "pay_order_b",
    ])
    expect(amountsOf(plan.captures)).toEqual([49, 51])
  })
})

describe("planCartPaymentVoid", () => {
  it("voids once every order is canceled", () => {
    expect(
      planCartPaymentVoid(cartCollection([]), [
        order("order_a", 98, { status: "canceled" }),
        order("order_b", 102, { status: "canceled" }),
      ])
    ).toEqual({
      payment_ids: ["pay_cart"],
      payment_collection_ids: ["pay_col_cart"],
    })
  })

  it("keeps the authorization while an order is open", () => {
    expect(
      planCartPaymentVoid(cartCollection([]), [
        order("order_a", 98, { status: "canceled" }),
        order("order_b", 102),
      ]).payment_ids
    ).toEqual([])
  })

  it("does not void a captured payment", () => {
    expect(
      planCartPaymentVoid(cartCollection([200]), [
        order("order_a", 98, { status: "canceled" }),
        order("order_b", 102, { status: "canceled" }),
      ]).payment_ids
    ).toEqual([])
  })
})

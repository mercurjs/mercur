import { MathBN } from "@medusajs/framework/utils"

import { allocateProportionally } from "../split-order-payment"
import { resolveOrderPaymentCollections } from "../split-order-payment-group"

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

  it("falls back to the cart collection for orders placed before the split", () => {
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

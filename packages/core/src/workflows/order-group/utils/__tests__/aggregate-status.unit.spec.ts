import type { OrderDetailDTO } from "@medusajs/framework/types"

import { getLastPaymentStatus } from "../aggregate-status"

const orderWithPaymentCollection = (
  paymentCollection: Record<string, unknown>,
) =>
  ({
    currency_code: "usd",
    payment_collections: [paymentCollection],
  }) as unknown as OrderDetailDTO

describe("getLastPaymentStatus", () => {
  it.each([
    [
      "fully captured",
      {
        status: "captured",
        amount: 100,
        captured_amount: 100,
        refunded_amount: 0,
      },
      "captured",
    ],
    [
      "fully refunded",
      {
        status: "refunded",
        amount: 100,
        captured_amount: 100,
        refunded_amount: 100,
      },
      "refunded",
    ],
    [
      "partially captured",
      {
        status: "captured",
        amount: 100,
        captured_amount: 50,
        refunded_amount: 0,
      },
      "partially_captured",
    ],
    [
      "partially refunded",
      {
        status: "refunded",
        amount: 100,
        captured_amount: 100,
        refunded_amount: 50,
      },
      "partially_refunded",
    ],
    [
      "authorized",
      {
        status: "authorized",
        amount: 100,
        captured_amount: 0,
        refunded_amount: 0,
      },
      "authorized",
    ],
  ])(
    "returns the terminal status for the %s collection",
    (_, collection, expected) => {
      expect(getLastPaymentStatus(orderWithPaymentCollection(collection))).toBe(
        expected,
      )
    },
  )
})

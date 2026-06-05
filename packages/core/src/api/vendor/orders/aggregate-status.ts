/**
 * Mercur-local mirror of Medusa's order status aggregation helpers
 * (`@medusajs/core-flows/dist/order/utils/aggregate-status`). The
 * upstream module is not re-exported by `@medusajs/core-flows`'s
 * package `exports`, so we cannot import it directly. Keep this
 * file in sync with the Medusa source if/when their logic changes.
 *
 * Source: medusa/packages/core/core-flows/src/order/utils/aggregate-status.ts
 */
import {
  defaultCurrencies,
  getEpsilonFromDecimalPrecision,
  isDefined,
  MathBN,
} from "@medusajs/framework/utils"

type PaymentCollectionLike = {
  status?: string | null
  amount?: number | null
  captured_amount?: number | null
  refunded_amount?: number | null
}

type FulfillmentLike = {
  canceled_at?: string | Date | null
  delivered_at?: string | Date | null
  shipped_at?: string | Date | null
  packed_at?: string | Date | null
}

type ItemLike = {
  raw_quantity?: unknown
  detail?: { raw_fulfilled_quantity?: unknown } | null
}

export type OrderForStatusAggregation = {
  currency_code?: string | null
  payment_collections?: PaymentCollectionLike[] | null
  fulfillments?: FulfillmentLike[] | null
  items?: ItemLike[] | null
}

const PaymentStatus = {
  NOT_PAID: "not_paid",
  AWAITING: "awaiting",
  CAPTURED: "captured",
  PARTIALLY_CAPTURED: "partially_captured",
  PARTIALLY_REFUNDED: "partially_refunded",
  REFUNDED: "refunded",
  CANCELED: "canceled",
  REQUIRES_ACTION: "requires_action",
  AUTHORIZED: "authorized",
  PARTIALLY_AUTHORIZED: "partially_authorized",
} as const

export const getLastPaymentStatus = (order: OrderForStatusAggregation) => {
  const collections = order.payment_collections ?? []
  const upperCurCode = order.currency_code?.toUpperCase() as string
  const currencyEpsilon = getEpsilonFromDecimalPrecision(
    defaultCurrencies[upperCurCode]?.decimal_digits
  )

  const tally: Record<string, number> = {}
  for (const status in PaymentStatus) {
    tally[
      PaymentStatus[status as keyof typeof PaymentStatus] as string
    ] = 0
  }

  for (const pc of collections) {
    const amount = (pc.amount ?? 0) as number
    const captured = (pc.captured_amount ?? 0) as number
    const refunded = (pc.refunded_amount ?? 0) as number

    if (
      MathBN.gt(captured, 0) ||
      (isDefined(pc.amount) && MathBN.eq(amount, 0))
    ) {
      const isGte = MathBN.lte(
        MathBN.sub(amount, captured),
        currencyEpsilon
      )
      tally[PaymentStatus.CAPTURED] += isGte ? 1 : 0.5
    }

    if (MathBN.gt(refunded, 0)) {
      const isGte = MathBN.lte(
        MathBN.sub(amount, refunded),
        currencyEpsilon
      )
      tally[PaymentStatus.REFUNDED] += isGte ? 1 : 0.5
    }

    if (pc.status) {
      tally[pc.status] = (tally[pc.status] ?? 0) + 1
    }
  }

  const total = collections.length
  const totalExceptCanceled = total - (tally[PaymentStatus.CANCELED] ?? 0)

  if ((tally[PaymentStatus.REQUIRES_ACTION] ?? 0) > 0) {
    return PaymentStatus.REQUIRES_ACTION
  }

  if ((tally[PaymentStatus.REFUNDED] ?? 0) > 0) {
    if (tally[PaymentStatus.REFUNDED] === tally[PaymentStatus.CAPTURED]) {
      return PaymentStatus.REFUNDED
    }
    return PaymentStatus.PARTIALLY_REFUNDED
  }

  if ((tally[PaymentStatus.CAPTURED] ?? 0) > 0) {
    if (tally[PaymentStatus.CAPTURED] === totalExceptCanceled) {
      return PaymentStatus.CAPTURED
    }
    return PaymentStatus.PARTIALLY_CAPTURED
  }

  if ((tally[PaymentStatus.AUTHORIZED] ?? 0) > 0) {
    if (tally[PaymentStatus.AUTHORIZED] === totalExceptCanceled) {
      return PaymentStatus.AUTHORIZED
    }
    return PaymentStatus.PARTIALLY_AUTHORIZED
  }

  if (
    (tally[PaymentStatus.CANCELED] ?? 0) > 0 &&
    tally[PaymentStatus.CANCELED] === total
  ) {
    return PaymentStatus.CANCELED
  }

  if ((tally[PaymentStatus.AWAITING] ?? 0) > 0) {
    return PaymentStatus.AWAITING
  }

  return PaymentStatus.NOT_PAID
}

const FulfillmentStatus = {
  NOT_FULFILLED: "not_fulfilled",
  PARTIALLY_FULFILLED: "partially_fulfilled",
  FULFILLED: "fulfilled",
  PARTIALLY_SHIPPED: "partially_shipped",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
  PARTIALLY_DELIVERED: "partially_delivered",
  CANCELED: "canceled",
} as const

const statusMap: Record<string, string> = {
  canceled_at: FulfillmentStatus.CANCELED,
  delivered_at: FulfillmentStatus.DELIVERED,
  shipped_at: FulfillmentStatus.SHIPPED,
  packed_at: FulfillmentStatus.FULFILLED,
}

export const getLastFulfillmentStatus = (
  order: OrderForStatusAggregation
) => {
  const fulfillments = order.fulfillments ?? []
  const tally: Record<string, number> = {}
  for (const s in FulfillmentStatus) {
    tally[
      FulfillmentStatus[s as keyof typeof FulfillmentStatus] as string
    ] = 0
  }

  for (const f of fulfillments) {
    for (const key in statusMap) {
      if (f[key as keyof FulfillmentLike]) {
        tally[statusMap[key]] += 1
        break
      }
    }
  }

  const total = fulfillments.length
  const totalExceptCanceled =
    total - (tally[FulfillmentStatus.CANCELED] ?? 0)

  const hasUnfulfilledItems =
    (order.items ?? []).filter(
      (i) =>
        isDefined(i?.detail?.raw_fulfilled_quantity) &&
        MathBN.lt(
          i!.detail!.raw_fulfilled_quantity as number,
          i.raw_quantity as number
        )
    ).length > 0

  if ((tally[FulfillmentStatus.DELIVERED] ?? 0) > 0) {
    if (
      tally[FulfillmentStatus.DELIVERED] === totalExceptCanceled &&
      !hasUnfulfilledItems
    ) {
      return FulfillmentStatus.DELIVERED
    }
    return FulfillmentStatus.PARTIALLY_DELIVERED
  }

  if ((tally[FulfillmentStatus.SHIPPED] ?? 0) > 0) {
    if (
      tally[FulfillmentStatus.SHIPPED] === totalExceptCanceled &&
      !hasUnfulfilledItems
    ) {
      return FulfillmentStatus.SHIPPED
    }
    return FulfillmentStatus.PARTIALLY_SHIPPED
  }

  if ((tally[FulfillmentStatus.FULFILLED] ?? 0) > 0) {
    if (
      tally[FulfillmentStatus.FULFILLED] === totalExceptCanceled &&
      !hasUnfulfilledItems
    ) {
      return FulfillmentStatus.FULFILLED
    }
    return FulfillmentStatus.PARTIALLY_FULFILLED
  }

  if (
    (tally[FulfillmentStatus.CANCELED] ?? 0) > 0 &&
    tally[FulfillmentStatus.CANCELED] === total
  ) {
    return FulfillmentStatus.CANCELED
  }

  return FulfillmentStatus.NOT_FULFILLED
}

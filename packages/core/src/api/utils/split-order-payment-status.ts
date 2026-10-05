import type { OrderDetailDTO } from "@medusajs/framework/types"
import { deduplicate } from "@medusajs/framework/utils"

import { getLastPaymentStatus } from "../../workflows/order-group/utils/aggregate-status"

import { resolveOrderPaymentCollections } from "../../workflows/payment/utils/split-order-payment-group"

type OrderWithCartPaymentCollection = {
  cart?: { payment_collection?: { metadata?: Record<string, unknown> | null } | null } | null
  payment_collections?: unknown[]
  payment_status?: string
}

// An order is paid through the cart's shared payment collection until that
// payment is captured, and through its own linked collection afterwards. Both
// are always loaded so the routes can pick the right one and recompute
// `payment_status`, even when the client sends an absolute `fields=` list that
// would otherwise replace the route defaults.
const PAYMENT_COLLECTION_FIELDS = [
  "*",
  "payments.*",
  "payments.refunds.*",
  "payments.refunds.refund_reason.*",
  "payment_sessions.*",
]

export const withCartPaymentCollectionFields = (fields: string[]): string[] => {
  return deduplicate([
    ...fields,
    ...PAYMENT_COLLECTION_FIELDS.map((f) => `payment_collections.${f}`),
    ...PAYMENT_COLLECTION_FIELDS.map((f) => `cart.payment_collection.${f}`),
  ])
}

// Exposes the order's payment collections under `payment_collections` whichever
// way they are attached, and recomputes `payment_status` from them: Medusa's
// aggregation only reads the linked ones.
export const normalizeOrderPaymentCollections = <
  T extends OrderWithCartPaymentCollection
>(
  order: T
): T => {
  const hadCart = !!order.cart
  const paymentCollections = resolveOrderPaymentCollections(order)

  delete order.cart

  if (!hadCart && !order.payment_collections) {
    return order
  }

  order.payment_collections = paymentCollections
  order.payment_status = getLastPaymentStatus(
    order as unknown as OrderDetailDTO
  )

  return order
}

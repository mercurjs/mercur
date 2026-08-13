import { MedusaContainer } from "@medusajs/framework"
import type { OrderDetailDTO } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

import { deduplicate } from "@medusajs/framework/utils"

import { getLastPaymentStatus } from "../../../workflows/order-group/utils/aggregate-status"

type OrderWithCartPaymentCollection = {
  cart?: { payment_collection?: unknown } | null
  payment_collections?: unknown[]
  payment_status?: string
}

// The shared cart payment collection is reached through the cart, not linked
// to the order. These fields must always be loaded so the routes can normalize
// them back onto `payment_collections` and recompute `payment_status` — even
// when the client sends an absolute `fields=` list that would otherwise replace
// the route defaults.
const CART_PAYMENT_COLLECTION_FIELDS = [
  "cart.payment_collection.*",
  "cart.payment_collection.payments.*",
  "cart.payment_collection.payments.refunds.*",
  "cart.payment_collection.payments.refunds.refund_reason.*",
  "cart.payment_collection.payment_sessions.*",
]

export const withCartPaymentCollectionFields = (
  fields: string[]
): string[] => {
  return deduplicate([...fields, ...CART_PAYMENT_COLLECTION_FIELDS])
}

// The shared cart payment collection is fetched via `cart.payment_collection`
// (it is not linked directly to an order). Expose it back on the order under
// `payment_collections` so consumers keep the familiar shape, and recompute
// `payment_status` from it — Medusa's aggregation reads the linked payment
// collections, which are always empty for split orders under the cart-path model.
export const normalizeOrderPaymentCollections = <
  T extends OrderWithCartPaymentCollection
>(
  order: T
): T => {
  const paymentCollection = order.cart?.payment_collection
  order.payment_collections = paymentCollection ? [paymentCollection] : []
  delete order.cart

  order.payment_status = getLastPaymentStatus(
    order as unknown as OrderDetailDTO
  )

  return order
}

export const validateSellerOrder = async (
  scope: MedusaContainer,
  sellerId: string,
  orderIdOrIds: string | string[]
) => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  const orderIds = Array.isArray(orderIdOrIds) ? orderIdOrIds : [orderIdOrIds]

  const { data: sellerOrders } = await query.graph({
    entity: "order_seller",
    filters: {
      seller_id: sellerId,
      order_id: orderIds,
    },
    fields: ["seller_id", "order_id"],
  })

  const foundOrderIds = new Set(sellerOrders.map((so) => so.order_id))
  const missingOrderIds = orderIds.filter((id) => !foundOrderIds.has(id))

  if (missingOrderIds.length > 0) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Order with id: ${missingOrderIds.join(", ")} was not found`
    )
  }
}

import { MedusaContainer } from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

import { normalizeOrderPaymentCollections } from "../../utils/split-order-payment-status"

export { withCartPaymentCollectionFields } from "../../utils/split-order-payment-status"

type VendorOrderPaymentCollection = {
  payments?: { data?: unknown }[] | null
  payment_sessions?: { data?: unknown; context?: unknown }[] | null
}

// Provider data holds the buyer's payment-page tokens and secrets.
export const normalizeVendorOrderPayments = <
  T extends Parameters<typeof normalizeOrderPaymentCollections>[0]
>(
  order: T
): T => {
  normalizeOrderPaymentCollections(order)

  for (const collection of (order.payment_collections ??
    []) as VendorOrderPaymentCollection[]) {
    collection.payments?.forEach((payment) => delete payment.data)
    collection.payment_sessions?.forEach((session) => {
      delete session.data
      delete session.context
    })
  }

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

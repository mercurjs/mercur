import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { CommissionLineDTO } from "@mercurjs/types"

const COMMISSION_LINE_FIELDS = [
  "id",
  "item_id",
  "shipping_method_id",
  "commission_rate_id",
  "code",
  "rate",
  "amount",
  "description",
  "created_at",
  "updated_at",
  "deleted_at",
]

/**
 * The order→commission links resolve for items but not shipping methods
 * (and the two cannot be co-resolved in one graph query), so commission is
 * always read from the commission module by the order's item + shipping ids.
 */
export const getOrderCommissionLines = async (
  scope: MedusaContainer,
  orderId: string,
  sellerId?: string
): Promise<{ found: boolean; commission_lines: CommissionLineDTO[] }> => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  const orderFields = ["id", "items.id", "shipping_methods.id"]
  if (sellerId) {
    orderFields.push("seller.id")
  }

  const {
    data: [order],
  } = await query.graph({
    entity: "order",
    fields: orderFields,
    filters: { id: orderId },
  })

  if (!order) {
    return { found: false, commission_lines: [] }
  }

  if (sellerId) {
    const sellers = Array.isArray(order.seller) ? order.seller : [order.seller]
    const owned = sellers.some((s: { id?: string } | null) => s?.id === sellerId)
    if (!owned) {
      return { found: false, commission_lines: [] }
    }
  }

  const itemIds = (order.items ?? [])
    .map((item: { id: string }) => item.id)
    .filter(Boolean)
  const shippingMethodIds = (order.shipping_methods ?? [])
    .map((method: { id: string }) => method.id)
    .filter(Boolean)

  const filters: Record<string, unknown>[] = []
  if (itemIds.length) {
    filters.push({ item_id: itemIds })
  }
  if (shippingMethodIds.length) {
    filters.push({ shipping_method_id: shippingMethodIds })
  }

  if (!filters.length) {
    return { found: true, commission_lines: [] }
  }

  const { data: commission_lines } = await query.graph({
    entity: "commission_line",
    fields: COMMISSION_LINE_FIELDS,
    filters: { $or: filters },
  })

  return {
    found: true,
    commission_lines: commission_lines as CommissionLineDTO[],
  }
}

import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export const resolveOrderSellerId = async (
  container: MedusaContainer,
  orderId: string
): Promise<string | undefined> => {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: links } = await query.graph({
    entity: "order_seller",
    fields: ["seller_id"],
    filters: { order_id: orderId },
  })
  return (links?.[0] as { seller_id?: string } | undefined)?.seller_id
}

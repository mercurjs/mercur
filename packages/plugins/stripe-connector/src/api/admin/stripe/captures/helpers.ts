import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"

import { AdminStripeCapture } from "../../../../types/http"

export async function refetchCapture(
  container: MedusaContainer,
  orderGroupId: string,
  fields: string[]
): Promise<AdminStripeCapture> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const {
    data: [capture],
  } = await query.graph({
    entity: "stripe_capture",
    fields,
    filters: { order_group_id: orderGroupId },
  })
  if (!capture) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `No capture for order group ${orderGroupId}`)
  }
  return capture as unknown as AdminStripeCapture
}

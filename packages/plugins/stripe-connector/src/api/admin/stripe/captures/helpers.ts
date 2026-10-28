import { MedusaContainer } from "@medusajs/framework/types"
import { MedusaError } from "@medusajs/framework/utils"
import { refetchEntity } from "@medusajs/framework/http"

import { AdminStripeCapture } from "../../../../types/http"

export async function refetchCapture(
  container: MedusaContainer,
  orderGroupId: string,
  fields: string[]
): Promise<AdminStripeCapture> {
  const capture = await refetchEntity({
    entity: "stripe_capture",
    idOrFilter: { order_group_id: orderGroupId },
    scope: container,
    fields,
  })
  if (!capture) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `No capture for order group ${orderGroupId}`)
  }
  return capture as AdminStripeCapture
}

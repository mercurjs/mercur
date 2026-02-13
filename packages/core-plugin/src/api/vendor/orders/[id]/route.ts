import { getOrderDetailWorkflow } from "@medusajs/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"
import { HttpTypes } from "@mercurjs/types"

import { validateSellerOrder } from "../helpers"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.VendorOrderResponse>
) => {
  const sellerId = req.auth_context.actor_id

  await validateSellerOrder(req.scope, sellerId, req.params.id)

  const workflow = getOrderDetailWorkflow(req.scope)
  const { result } = await workflow.run({
    input: {
      fields: req.queryConfig.fields,
      order_id: req.params.id,
    },
  })

  res.json({ order: result as HttpTypes.VendorOrderResponse["order"] })
}

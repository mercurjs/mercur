import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { createOrderFulfillmentWorkflow } from "@medusajs/medusa/core-flows"
import { HttpTypes } from "@mercurjs/types"

import { validateSellerOrder } from "../../helpers"
import { VendorCreateFulfillmentType } from "../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorCreateFulfillmentType>,
  res: MedusaResponse<HttpTypes.VendorFulfillmentResponse>
) => {
  const { id } = req.params
  const sellerId = req.auth_context.actor_id

  await validateSellerOrder(req.scope, sellerId, id)

  const { result: fulfillment } = await createOrderFulfillmentWorkflow(
    req.scope
  ).run({
    input: {
      order_id: id,
      created_by: sellerId,
      ...req.validatedBody,
    },
  })

  res.json({ fulfillment })
}

import { deleteFulfillmentSetsWorkflow } from "@medusajs/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { HttpTypes } from "@mercurjs/types"

import { validateSellerFulfillmentSet } from "../helpers"

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.VendorDeleteResponse>
) => {
  const { id } = req.params
  const sellerId = req.auth_context.actor_id

  await validateSellerFulfillmentSet(req.scope, sellerId, id)

  await deleteFulfillmentSetsWorkflow(req.scope).run({
    input: { ids: [id] },
  })

  res.json({
    id,
    object: "fulfillment_set",
    deleted: true,
  })
}

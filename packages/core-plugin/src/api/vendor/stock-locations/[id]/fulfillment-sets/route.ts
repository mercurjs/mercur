import { createLocationFulfillmentSetWorkflow } from "@medusajs/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { HttpTypes } from "@mercurjs/types"

import { refetchStockLocation, validateSellerStockLocation } from "../../helpers"
import { VendorCreateStockLocationFulfillmentSetType } from "../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorCreateStockLocationFulfillmentSetType>,
  res: MedusaResponse<HttpTypes.VendorStockLocationResponse>
) => {
  const { id } = req.params
  const sellerId = req.auth_context.actor_id

  await validateSellerStockLocation(req.scope, sellerId, id)

  await createLocationFulfillmentSetWorkflow(req.scope).run({
    input: {
      location_id: id,
      fulfillment_set_data: {
        name: req.validatedBody.name,
        type: req.validatedBody.type,
      },
    },
  })

  const stockLocation = await refetchStockLocation(
    req.scope,
    id,
    req.queryConfig.fields
  )

  res.json({ stock_location: stockLocation })
}

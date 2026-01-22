import { createServiceZonesWorkflow } from "@medusajs/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { HttpTypes } from "@mercurjs/types"

import { refetchFulfillmentSet, validateSellerFulfillmentSet } from "../../helpers"
import { VendorCreateServiceZoneType } from "../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorCreateServiceZoneType>,
  res: MedusaResponse<HttpTypes.VendorFulfillmentSetResponse>
) => {
  const { id } = req.params
  const sellerId = req.auth_context.actor_id

  await validateSellerFulfillmentSet(req.scope, sellerId, id)

  await createServiceZonesWorkflow(req.scope).run({
    input: {
      data: [
        {
          fulfillment_set_id: id,
          name: req.validatedBody.name,
          geo_zones: req.validatedBody.geo_zones,
        },
      ],
    },
  })

  const fulfillmentSet = await refetchFulfillmentSet(
    req.scope,
    id,
    req.queryConfig.fields
  )

  res.json({ fulfillment_set: fulfillmentSet })
}

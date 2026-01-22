import { batchLinksWorkflow } from "@medusajs/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { HttpTypes } from "@medusajs/framework/types"
import { HttpTypes as VendorHttpTypes } from "@mercurjs/types"
import { Modules } from "@medusajs/framework/utils"

import { refetchStockLocation, validateSellerStockLocation } from "../../helpers"

const buildLinks = (id: string, fulfillmentProviderIds: string[]) => {
  return fulfillmentProviderIds.map((fulfillmentProviderId) => ({
    [Modules.STOCK_LOCATION]: { stock_location_id: id },
    [Modules.FULFILLMENT]: {
      fulfillment_provider_id: fulfillmentProviderId,
    },
  }))
}

export const POST = async (
  req: AuthenticatedMedusaRequest<HttpTypes.AdminBatchLink>,
  res: MedusaResponse<VendorHttpTypes.VendorStockLocationResponse>
) => {
  const { id } = req.params
  const sellerId = req.auth_context.actor_id
  const { add = [], remove = [] } = req.validatedBody

  await validateSellerStockLocation(req.scope, sellerId, id)

  await batchLinksWorkflow(req.scope).run({
    input: {
      create: buildLinks(id, add),
      delete: buildLinks(id, remove),
    },
  })

  const stockLocation = await refetchStockLocation(
    req.scope,
    id,
    req.queryConfig.fields
  )

  res.json({ stock_location: stockLocation })
}

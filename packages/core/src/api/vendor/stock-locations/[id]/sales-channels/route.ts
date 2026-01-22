import { linkSalesChannelsToStockLocationWorkflow } from "@medusajs/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { HttpTypes } from "@medusajs/framework/types"
import { HttpTypes as VendorHttpTypes } from "@mercurjs/types"

import { refetchStockLocation, validateSellerStockLocation } from "../../helpers"

export const POST = async (
  req: AuthenticatedMedusaRequest<HttpTypes.AdminBatchLink>,
  res: MedusaResponse<VendorHttpTypes.VendorStockLocationResponse>
) => {
  const { id } = req.params
  const sellerId = req.auth_context.actor_id
  const { add, remove } = req.validatedBody

  await validateSellerStockLocation(req.scope, sellerId, id)

  await linkSalesChannelsToStockLocationWorkflow(req.scope).run({
    input: {
      id,
      add,
      remove,
    },
  })

  const stockLocation = await refetchStockLocation(
    req.scope,
    id,
    req.queryConfig.fields
  )

  res.json({ stock_location: stockLocation })
}

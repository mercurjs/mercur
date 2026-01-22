import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { createSellerStockLocationsWorkflow } from "../../../workflows/stock-location"
import { refetchStockLocation } from "./helpers"
import { VendorCreateStockLocationType } from "./validators"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.VendorStockLocationListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: stock_locations, metadata } = await query.graph({
    entity: "stock_location",
    fields: req.queryConfig.fields,
    filters: req.filterableFields,
    pagination: req.queryConfig.pagination,
  })

  res.json({
    stock_locations,
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorCreateStockLocationType>,
  res: MedusaResponse<HttpTypes.VendorStockLocationResponse>
) => {
  const sellerId = req.auth_context.actor_id

  const { result } = await createSellerStockLocationsWorkflow(req.scope).run({
    input: {
      locations: [req.validatedBody],
      seller_id: sellerId,
    },
  })

  const stockLocation = await refetchStockLocation(
    req.scope,
    result[0].id,
    req.queryConfig.fields
  )

  res.status(201).json({ stock_location: stockLocation })
}

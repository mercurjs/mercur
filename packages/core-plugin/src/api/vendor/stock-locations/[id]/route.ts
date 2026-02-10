import {
  deleteStockLocationsWorkflow,
  updateStockLocationsWorkflow,
} from "@medusajs/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { refetchStockLocation, validateSellerStockLocation } from "../helpers"
import { VendorUpdateStockLocationType } from "../validators"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.VendorStockLocationResponse>
) => {
  const sellerId = req.auth_context.actor_id

  await validateSellerStockLocation(req.scope, sellerId, req.params.id)

  const stockLocation = await refetchStockLocation(
    req.scope,
    req.params.id,
    req.queryConfig.fields
  )

  if (!stockLocation) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Stock location with id ${req.params.id} was not found`
    )
  }

  res.json({ stock_location: stockLocation })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorUpdateStockLocationType>,
  res: MedusaResponse<HttpTypes.VendorStockLocationResponse>
) => {
  const sellerId = req.auth_context.actor_id

  await validateSellerStockLocation(req.scope, sellerId, req.params.id)

  await updateStockLocationsWorkflow(req.scope).run({
    input: {
      selector: { id: req.params.id },
      update: req.validatedBody,
    },
  })

  const stockLocation = await refetchStockLocation(
    req.scope,
    req.params.id,
    req.queryConfig.fields
  )

  res.json({ stock_location: stockLocation })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.VendorDeleteResponse>
) => {
  const sellerId = req.auth_context.actor_id

  await validateSellerStockLocation(req.scope, sellerId, req.params.id)

  await deleteStockLocationsWorkflow(req.scope).run({
    input: { ids: [req.params.id] },
  })

  res.json({
    id: req.params.id,
    object: "stock_location",
    deleted: true,
  })
}

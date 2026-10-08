import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { batchInventoryItemLevelsWorkflow } from "@medusajs/core-flows"
import { HttpTypes } from "@mercurjs/types"

import { validateSellerStockLocations } from "../../../stock-locations/helpers"
import {
  validateSellerInventoryItems,
  validateSellerInventoryLevels,
} from "../../helpers"
import { VendorBatchInventoryItemLevelsType } from "../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorBatchInventoryItemLevelsType>,
  res: MedusaResponse<HttpTypes.VendorBatchInventoryItemLevelResponse>
) => {
  const body = req.validatedBody
  const sellerId = req.seller_context!.seller_id
  const levels = [...(body.create ?? []), ...(body.update ?? [])]

  await validateSellerInventoryItems(
    req.scope,
    sellerId,
    levels.map((level) => level.inventory_item_id)
  )
  await validateSellerStockLocations(
    req.scope,
    sellerId,
    levels.map((level) => level.location_id)
  )
  await validateSellerInventoryLevels(req.scope, sellerId, body.delete ?? [])

  const { result } = await batchInventoryItemLevelsWorkflow(req.scope).run({
    input: {
      create: body.create ?? [],
      update: body.update ?? [],
      delete: body.delete ?? [],
      force: body.force ?? false,
    },
  })

  res.json({
    created: result.created,
    updated: result.updated,
    deleted: result.deleted,
  })
}

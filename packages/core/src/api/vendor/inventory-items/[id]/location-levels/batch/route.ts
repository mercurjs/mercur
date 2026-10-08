import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { batchInventoryItemLevelsWorkflow } from "@medusajs/core-flows"
import { HttpTypes } from "@mercurjs/types"

import { validateSellerStockLocations } from "../../../../stock-locations/helpers"
import {
  validateSellerInventoryItem,
  validateSellerInventoryLevels,
} from "../../../helpers"
import { VendorBatchInventoryItemLocationsLevelType } from "../../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorBatchInventoryItemLocationsLevelType>,
  res: MedusaResponse<HttpTypes.VendorBatchInventoryItemLevelResponse>
) => {
  const { id } = req.params

  const sellerId = req.seller_context!.seller_id
  await validateSellerInventoryItem(req.scope, sellerId, id)
  await validateSellerStockLocations(
    req.scope,
    sellerId,
    [
      ...(req.validatedBody.create ?? []),
      ...(req.validatedBody.update ?? []),
    ].map((level) => level.location_id)
  )
  await validateSellerInventoryLevels(
    req.scope,
    sellerId,
    req.validatedBody.delete ?? []
  )

  const { result } = await batchInventoryItemLevelsWorkflow(req.scope).run({
    input: {
      delete: req.validatedBody.delete ?? [],
      create:
        req.validatedBody.create?.map((c) => ({
          ...c,
          inventory_item_id: id,
        })) ?? [],
      update:
        req.validatedBody.update?.map((u) => ({
          ...u,
          inventory_item_id: id,
        })) ?? [],
      force: req.validatedBody.force ?? false,
    },
  })

  res.json({
    created: result.created,
    updated: result.updated,
    deleted: result.deleted,
  })
}

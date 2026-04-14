import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { batchInventoryItemLevelsWorkflow } from "@medusajs/core-flows"
import { HttpTypes } from "@mercurjs/types"

import { VendorBatchInventoryItemLevelsType } from "../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorBatchInventoryItemLevelsType>,
  res: MedusaResponse<HttpTypes.VendorBatchInventoryItemLevelResponse>
) => {
  const body = req.validatedBody

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

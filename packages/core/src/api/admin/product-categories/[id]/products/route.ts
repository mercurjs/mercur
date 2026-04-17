import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { batchLinkProductsToCategoryWorkflow } from "@medusajs/core-flows"

import { AdminBatchLinkProductsToCategoryType } from "../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminBatchLinkProductsToCategoryType>,
  res: MedusaResponse
) => {
  const { add, remove } = req.validatedBody

  await batchLinkProductsToCategoryWorkflow(req.scope).run({
    input: {
      id: req.params.id,
      add,
      remove,
    },
  })

  res.status(200).json({
    id: req.params.id,
    object: "product_category",
  })
}

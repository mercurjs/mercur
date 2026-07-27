import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { AdminBatchLinkProductsToCategoryType } from "../../validators"
import { assignProductsToCategoryWorkflow } from "../../../../../workflows/product/workflows/assign-products-to-category"

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminBatchLinkProductsToCategoryType>,
  res: MedusaResponse
) => {
  const { add, remove } = req.validatedBody

  await assignProductsToCategoryWorkflow(req.scope).run({
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

import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import { linkSellersToProductCategoryWorkflow } from "../../../../../workflows/product/workflows/link-sellers-to-product-category"
import { AdminBatchLinkSellersToCategoryType } from "../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminBatchLinkSellersToCategoryType>,
  res: MedusaResponse
) => {
  const { add, remove } = req.validatedBody

  await linkSellersToProductCategoryWorkflow(req.scope).run({
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

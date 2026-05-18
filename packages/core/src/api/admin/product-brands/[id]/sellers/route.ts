import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import { linkSellersToProductBrandWorkflow } from "../../../../../workflows/product/workflows/link-sellers-to-product-brand"
import { AdminBatchLinkSellersToBrandType } from "../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminBatchLinkSellersToBrandType>,
  res: MedusaResponse
) => {
  const { add, remove } = req.validatedBody

  await linkSellersToProductBrandWorkflow(req.scope).run({
    input: {
      id: req.params.id,
      add,
      remove,
    },
  })

  res.status(200).json({
    id: req.params.id,
    object: "product_brand",
  })
}

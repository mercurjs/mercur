import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { ensureSellerOwnsProduct } from "../../../products/helpers"
import { VendorBatchLinkProductsToCategoryType } from "../../validators"
import { assignProductsToCategoryWorkflow } from "../../../../../workflows/product/workflows/assign-products-to-category"

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorBatchLinkProductsToCategoryType>,
  res: MedusaResponse<HttpTypes.VendorProductCategoryResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const sellerId = req.seller_context!.seller_id
  const { add, remove } = req.validatedBody

  const {
    data: [existing],
  } = await query.graph({
    entity: "product_category",
    fields: ["id"],
    filters: { id: req.params.id },
  })

  if (!existing) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product category with id ${req.params.id} was not found`
    )
  }

  const productIds = [...(add ?? []), ...(remove ?? [])]
  await ensureSellerOwnsProduct(req.scope, sellerId, productIds)

  await assignProductsToCategoryWorkflow(req.scope).run({
    input: {
      id: req.params.id,
      add,
      remove,
    },
  })

  const {
    data: [product_category],
  } = await query.graph({
    entity: "product_category",
    fields: req.queryConfig.fields,
    filters: { id: req.params.id },
  })

  res.status(200).json({ product_category })
}

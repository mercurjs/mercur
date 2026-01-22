import { batchLinkProductsToCategoryWorkflow } from "@medusajs/core-flows"
import {
  AdminProductCategoryResponse,
  HttpTypes,
} from "@medusajs/framework/types"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
  refetchEntity,
} from "@medusajs/framework/http"

import { validateSellerProducts } from "../../helpers"

export const POST = async (
  req: AuthenticatedMedusaRequest<
    HttpTypes.AdminBatchLink,
    HttpTypes.AdminProductCategoryParams
  >,
  res: MedusaResponse<AdminProductCategoryResponse>
) => {
  const { id } = req.params
  const sellerId = req.auth_context.actor_id

  const productIdsToValidate = [
    ...(req.validatedBody.add || []),
    ...(req.validatedBody.remove || []),
  ]

  await validateSellerProducts(req.scope, sellerId, productIdsToValidate)

  await batchLinkProductsToCategoryWorkflow(req.scope).run({
    input: { id, ...req.validatedBody },
  })

  const category = await refetchEntity({
    entity: "product_category",
    idOrFilter: id,
    scope: req.scope,
    fields: req.queryConfig.fields,
  })

  res.status(200).json({ product_category: category })
}

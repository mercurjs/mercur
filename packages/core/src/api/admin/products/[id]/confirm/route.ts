import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { confirmProductsWorkflow } from "../../../../../workflows/product/workflows/confirm-products"
import { AdminConfirmProductType } from "../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminConfirmProductType>,
  res: MedusaResponse<HttpTypes.AdminProductResponse>,
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const productId = req.params.id

  await confirmProductsWorkflow(req.scope).run({
    input: {
      product_ids: [productId],
      actor_id: req.auth_context?.actor_id,
      internal_note: req.validatedBody?.internal_note,
      additional_data: req.validatedBody?.additional_data,
    },
  })

  const {
    data: [product],
  } = await query.graph({
    entity: "product",
    fields: req.queryConfig.fields,
    filters: { id: productId },
  })

  res.json({ product })
}

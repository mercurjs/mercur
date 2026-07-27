import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { requestProductChangeWorkflow } from "../../../../../workflows/product/workflows/request-product-change"
import { AdminRequestProductChangesType } from "../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminRequestProductChangesType>,
  res: MedusaResponse<HttpTypes.AdminProductResponse>,
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const productId = req.params.id

  await requestProductChangeWorkflow(req.scope).run({
    input: {
      product_id: productId,
      message: req.validatedBody?.message,
      actor_id: req.auth_context?.actor_id,
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

import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { batchProductAttributeValuesWorkflow } from "../../../../../../workflows/product-attribute"
import { AdminBatchProductAttributesType } from "../../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminBatchProductAttributesType>,
  res: MedusaResponse<HttpTypes.AdminProductResponse>,
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const productId = req.params.id

  const { create, delete: toDelete } = req.validatedBody

  await batchProductAttributeValuesWorkflow(req.scope).run({
    input: {
      product_id: productId,
      create,
      delete: toDelete,
    },
  })

  const {
    data: [product],
  } = await query.graph({
    entity: "product",
    fields: req.queryConfig.fields,
    filters: { id: productId },
  })

  res.status(200).json({ product })
}

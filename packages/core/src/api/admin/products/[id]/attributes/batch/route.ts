import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes, ProductAttributeBatchInput } from "@mercurjs/types"

import { createAndLinkProductAttributesToProductWorkflow } from "../../../../../../workflows/product-attribute"
import { productAttributeBatchResponseFields } from "../../../../../utils"
import { AdminBatchProductAttributesType } from "../../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminBatchProductAttributesType>,
  res: MedusaResponse<HttpTypes.AdminProductResponse>,
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const productId = req.params.id

  const { add, remove, update, additional_data } =
    req.validatedBody as ProductAttributeBatchInput & {
      additional_data?: Record<string, unknown>
    }

  await createAndLinkProductAttributesToProductWorkflow(req.scope).run({
    input: { product_id: productId, add, remove, update, additional_data },
  })

  const {
    data: [product],
  } = await query.graph({
    entity: "product",
    fields: productAttributeBatchResponseFields,
    filters: { id: productId },
  })

  res.status(200).json({ product })
}

import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes, ProductAttributeBatchInput } from "@mercurjs/types"

import { createAndLinkProductAttributesToProductWorkflow } from "../../../../../../workflows/product-attribute"
import { productAttributeBatchResponseFields } from "../../../../../utils"
import { AdminBatchProductAttributesType } from "../../../validators"

/**
 * SPEC-014 §G: the single attribute-mutation endpoint for admin. Applies
 * add/remove/update directly via the batch engine.
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<AdminBatchProductAttributesType>,
  res: MedusaResponse<HttpTypes.AdminProductResponse>,
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const productId = req.params.id

  const { add, remove, update } =
    req.validatedBody as ProductAttributeBatchInput

  await createAndLinkProductAttributesToProductWorkflow(req.scope).run({
    input: { product_id: productId, add, remove, update },
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

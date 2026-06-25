import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { ProductAttributeBatchInput, ProductChangeDTO } from "@mercurjs/types"

import { productEditUpdateAttributesWorkflow } from "../../../../../../workflows/product-edit/workflows/product-edit-update-attributes"

export const POST = async (
  req: AuthenticatedMedusaRequest<ProductAttributeBatchInput>,
  res: MedusaResponse<{ product_change: ProductChangeDTO }>,
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const sellerId = req.seller_context!.seller_id
  const productId = req.params.id

  const { add, remove, update } = req.validatedBody

  const { result } = await productEditUpdateAttributesWorkflow(req.scope).run({
    input: { product_id: productId, created_by: sellerId, add, remove, update },
  })

  const {
    data: [product_change],
  } = await query.graph({
    entity: "product_change",
    fields: ["*", "actions.*"],
    filters: { id: result.id },
  })

  res.status(202).json({ product_change: product_change ?? result })
}

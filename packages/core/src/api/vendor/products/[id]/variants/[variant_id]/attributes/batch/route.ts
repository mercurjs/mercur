import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { ProductChangeDTO } from "@mercurjs/types"

import { productEditUpdateVariantAttributesWorkflow } from "../../../../../../../../workflows/product-edit/workflows/product-edit-update-variant-attributes"
import { VendorBatchVariantAttributesType } from "../../../../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorBatchVariantAttributesType>,
  res: MedusaResponse<{ product_change: ProductChangeDTO }>,
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const sellerId = req.seller_context!.seller_id
  const productId = req.params.id
  const variantId = req.params.variant_id

  const { add, remove, update } = req.validatedBody

  const { result } = await productEditUpdateVariantAttributesWorkflow(
    req.scope,
  ).run({
    input: {
      product_id: productId,
      variant_id: variantId,
      created_by: sellerId,
      add,
      remove,
      update,
    },
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

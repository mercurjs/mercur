import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes, ProductAttributeBatchInput } from "@mercurjs/types"

import { createAndLinkProductAttributesToProductWorkflow } from "../../../../../../workflows/product-attribute"
import { productAttributeBatchResponseFields } from "../../../../../utils"
import { ensureSellerOwnsProduct } from "../../../helpers"


export const POST = async (
  req: AuthenticatedMedusaRequest<ProductAttributeBatchInput>,
  res: MedusaResponse<HttpTypes.AdminProductResponse>,
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const sellerId = req.seller_context!.seller_id
  const productId = req.params.id

  await ensureSellerOwnsProduct(req.scope, sellerId, productId)

  const { add, remove, update } =
    req.validatedBody

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

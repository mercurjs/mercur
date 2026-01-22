import {
  deleteProductVariantsWorkflow,
  updateProductVariantsWorkflow,
} from "@medusajs/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { validateSellerProduct } from "../../../helpers"
import { VendorUpdateProductVariantType } from "../../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorUpdateProductVariantType>,
  res: MedusaResponse<HttpTypes.VendorProductResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const sellerId = req.auth_context.actor_id
  const { additional_data, ...update } = req.validatedBody

  await validateSellerProduct(req.scope, sellerId, req.params.id)

  await updateProductVariantsWorkflow(req.scope).run({
    input: {
      selector: { id: req.params.variant_id },
      update,
      additional_data: {
        ...additional_data,
        seller_id: sellerId,
      },
    },
  })

  const {
    data: [product],
  } = await query.graph({
    entity: "product",
    fields: req.queryConfig.fields,
    filters: { id: req.params.id },
  })

  res.json({ product })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.VendorDeleteResponse>
) => {
  const sellerId = req.auth_context.actor_id

  await validateSellerProduct(req.scope, sellerId, req.params.id)

  await deleteProductVariantsWorkflow(req.scope).run({
    input: { ids: [req.params.variant_id] },
  })

  res.json({
    id: req.params.variant_id,
    object: "product_variant",
    deleted: true,
  })
}

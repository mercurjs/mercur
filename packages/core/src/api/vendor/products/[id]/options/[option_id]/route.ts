import {
  deleteProductOptionsWorkflow,
  updateProductOptionsWorkflow,
} from "@medusajs/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { validateSellerProduct } from "../../../helpers"
import { VendorUpdateProductOptionType } from "../../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorUpdateProductOptionType>,
  res: MedusaResponse<HttpTypes.VendorProductResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const sellerId = req.auth_context.actor_id
  const { additional_data, ...update } = req.validatedBody

  await validateSellerProduct(req.scope, sellerId, req.params.id)

  await updateProductOptionsWorkflow(req.scope).run({
    input: {
      selector: { id: req.params.option_id },
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

  await deleteProductOptionsWorkflow(req.scope).run({
    input: { ids: [req.params.option_id] },
  })

  res.json({
    id: req.params.option_id,
    object: "product_option",
    deleted: true,
  })
}

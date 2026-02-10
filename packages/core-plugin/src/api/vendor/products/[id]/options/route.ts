import { createProductOptionsWorkflow } from "@medusajs/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { validateSellerProduct } from "../../helpers"
import { VendorCreateProductOptionType } from "../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorCreateProductOptionType>,
  res: MedusaResponse<HttpTypes.VendorProductResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const sellerId = req.auth_context.actor_id
  const { additional_data, ...rest } = req.validatedBody

  await validateSellerProduct(req.scope, sellerId, req.params.id)

  await createProductOptionsWorkflow(req.scope).run({
    input: {
      product_options: [
        {
          ...rest,
          product_id: req.params.id,
        },
      ],
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

  res.status(201).json({ product })
}

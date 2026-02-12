import { createProductVariantsWorkflow } from "@medusajs/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { validateSellerProduct } from "../../helpers"
import { VendorCreateProductVariantType } from "../../validators"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.VendorProductVariantListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const sellerId = req.auth_context.actor_id

  await validateSellerProduct(req.scope, sellerId, req.params.id)

  const { data: variants, metadata } = await query.graph({
    entity: "product_variant",
    fields: req.queryConfig.fields,
    filters: {
      product_id: req.params.id,
      ...req.filterableFields,
    },
    pagination: req.queryConfig.pagination,
  })

  res.json({
    variants,
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorCreateProductVariantType>,
  res: MedusaResponse<HttpTypes.VendorProductResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const sellerId = req.auth_context.actor_id
  const { additional_data, ...variantData } = req.validatedBody

  await validateSellerProduct(req.scope, sellerId, req.params.id)

  await createProductVariantsWorkflow(req.scope).run({
    input: {
      product_variants: [
        {
          ...variantData,
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

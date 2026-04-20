import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { AdditionalData } from "@medusajs/framework/types"
import { HttpTypes } from "@mercurjs/types"

import { createProductVariantsWorkflow } from "../../../../../workflows/product/workflows/create-product-variants"
import { AdminCreateProductVariantType } from "../../validators"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminProductVariantListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const productId = req.params.id

  const { data: variants, metadata } = await query.graph({
    entity: "variant",
    fields: req.queryConfig.fields,
    filters: { ...req.filterableFields, product_id: productId },
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
  req: AuthenticatedMedusaRequest<
    AdminCreateProductVariantType & AdditionalData
  >,
  res: MedusaResponse<HttpTypes.AdminProductResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const productId = req.params.id
  const { additional_data, ...rest } = req.validatedBody

  await createProductVariantsWorkflow(req.scope).run({
    input: {
      product_variants: [{ ...rest, product_id: productId }],
      additional_data,
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

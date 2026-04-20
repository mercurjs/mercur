import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { AdditionalData } from "@medusajs/framework/types"
import { HttpTypes } from "@mercurjs/types"

import { createProductBrandsWorkflow } from "../../../workflows/product/workflows/create-product-brands"
import { AdminCreateProductBrandType } from "./validators"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminProductBrandListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: product_brands, metadata } = await query.graph({
    entity: "product_brand",
    fields: req.queryConfig.fields,
    filters: req.filterableFields,
    pagination: req.queryConfig.pagination,
  })

  res.json({
    product_brands,
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminCreateProductBrandType & AdditionalData>,
  res: MedusaResponse<HttpTypes.AdminProductBrandResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { additional_data, ...payload } = req.validatedBody

  const { result } = await createProductBrandsWorkflow(req.scope).run({
    input: {
      brands: [payload],
    },
  })

  const {
    data: [product_brand],
  } = await query.graph({
    entity: "product_brand",
    fields: req.queryConfig.fields,
    filters: { id: result[0].id },
  })

  res.status(200).json({ product_brand })
}

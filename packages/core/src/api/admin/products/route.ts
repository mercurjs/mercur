import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { AdditionalData } from "@medusajs/framework/types"
import { HttpTypes } from "@mercurjs/types"

import { createProductsWorkflow } from "../../../workflows/product/workflows/create-products"
import { enrichProductAttributes } from "../../utils"
import { AdminCreateProductType, AdminGetProductsParamsType } from "./validators"

export const GET = async (
  req: AuthenticatedMedusaRequest<AdminGetProductsParamsType>,
  res: MedusaResponse<HttpTypes.AdminProductListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: products, metadata } = await query.graph({
    entity: "product",
    fields: req.queryConfig.fields,
    filters: req.filterableFields,
    pagination: req.queryConfig.pagination,
  })

  await enrichProductAttributes(req.scope, products as any[])

  res.json({
    products,
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminCreateProductType & AdditionalData>,
  res: MedusaResponse<HttpTypes.AdminProductResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { additional_data, ...productData } = req.validatedBody

  const { result } = await createProductsWorkflow(req.scope).run({
    input: {
      products: [{
        ...productData,
      }],
      additional_data,
    } as any,
  })

  const createdId = (result as { id: string }[])[0].id

  const {
    data: [product],
  } = await query.graph({
    entity: "product",
    fields: req.queryConfig.fields,
    filters: { id: createdId },
  })

  await enrichProductAttributes(req.scope, [product])

  res.status(200).json({ product })
}

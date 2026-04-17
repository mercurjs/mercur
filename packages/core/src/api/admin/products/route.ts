import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { AdditionalData } from "@medusajs/framework/types"
import { CreateProductDTO } from "@mercurjs/types"

import { createProductsWorkflow } from "../../../workflows/product/workflows/create-products"
import { AdminCreateProductType } from "./validators"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: products, metadata } = await query.graph({
    entity: "product",
    fields: req.queryConfig.fields,
    filters: req.filterableFields,
    pagination: req.queryConfig.pagination,
  })

  res.json({
    products,
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminCreateProductType & AdditionalData>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { additional_data, ...productData } = req.validatedBody

  const { result } = await createProductsWorkflow(req.scope).run({
    input: {
      products: [{
        ...productData,
        created_by_actor: 'admin',
        created_by: req.auth_context.actor_id
      } as unknown as CreateProductDTO],
      additional_data,
    },
  })

  const createdId = result[0].id

  const {
    data: [product],
  } = await query.graph({
    entity: "product",
    fields: req.queryConfig.fields,
    filters: { id: createdId },
  })

  res.status(200).json({ product })
}

import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { AdditionalData } from "@medusajs/framework/types"

import { createProductAttributesWorkflow } from "../../../workflows/product/workflows/create-product-attributes"
import { AdminCreateProductAttributeType } from "./validators"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: product_attributes, metadata } = await query.graph({
    entity: "product_attribute",
    fields: req.queryConfig.fields,
    filters: {
      ...req.filterableFields,
      is_global: true
    },
    pagination: req.queryConfig.pagination,
  })

  res.json({
    product_attributes,
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminCreateProductAttributeType & AdditionalData>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { additional_data, ...payload } = req.validatedBody

  const { result } = await createProductAttributesWorkflow(req.scope).run({
    input: {
      attributes: [{
        ...payload,
        is_global: true
      }],
    },
  })

  const createdId = result[0].id

  const {
    data: [product_attribute],
  } = await query.graph({
    entity: "product_attribute",
    fields: req.queryConfig.fields,
    filters: { id: createdId },
  })

  res.status(200).json({ product_attribute })
}

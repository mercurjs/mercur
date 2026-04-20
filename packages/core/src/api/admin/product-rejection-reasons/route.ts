import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { AdditionalData } from "@medusajs/framework/types"
import { HttpTypes } from "@mercurjs/types"

import { createProductRejectionReasonsWorkflow } from "../../../workflows/product/workflows/create-product-rejection-reasons"
import { AdminCreateProductRejectionReasonType } from "./validators"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminProductRejectionReasonListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: product_rejection_reasons, metadata } = await query.graph({
    entity: "product_rejection_reason",
    fields: req.queryConfig.fields,
    filters: req.filterableFields,
    pagination: req.queryConfig.pagination,
  })

  res.json({
    product_rejection_reasons,
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminCreateProductRejectionReasonType & AdditionalData>,
  res: MedusaResponse<HttpTypes.AdminProductRejectionReasonResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { additional_data, ...payload } = req.validatedBody

  const { result } = await createProductRejectionReasonsWorkflow(req.scope).run({
    input: {
      reasons: [payload],
    },
  })

  const {
    data: [product_rejection_reason],
  } = await query.graph({
    entity: "product_rejection_reason",
    fields: req.queryConfig.fields,
    filters: { id: result[0].id },
  })

  res.status(200).json({ product_rejection_reason })
}

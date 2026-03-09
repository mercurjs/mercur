import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { VendorRequestListResponse, VendorRequestResponse } from "../../../../types"
import { createProductCategoryRequestWorkflow } from "../../../../workflows/requests/workflows"
import { VendorCreateProductCategoryRequestType, VendorGetProductCategoryRequestsParamsType } from "./validators"

export async function GET(
  req: AuthenticatedMedusaRequest<VendorGetProductCategoryRequestsParamsType>,
  res: MedusaResponse<VendorRequestListResponse>
): Promise<void> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: entities, metadata } = await query.graph({
    entity: "product_category",
    fields: req.queryConfig.fields,
    filters: req.filterableFields,
    pagination: req.queryConfig.pagination,
  })

  res.json({
    requests: entities,
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
}

export async function POST(
  req: AuthenticatedMedusaRequest<VendorCreateProductCategoryRequestType>,
  res: MedusaResponse<VendorRequestResponse>
): Promise<void> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { result: category } = await createProductCategoryRequestWorkflow(req.scope).run({
    input: {
      product_category: req.validatedBody,
      submitter_id: req.auth_context.actor_id,
    },
  })

  const {
    data: [entity],
  } = await query.graph({
    entity: "product_category",
    fields: req.queryConfig.fields,
    filters: { id: category.id },
  })

  res.status(201).json({ request: entity })
}

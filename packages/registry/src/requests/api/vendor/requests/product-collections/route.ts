import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { VendorRequestListResponse, VendorRequestResponse } from "../../../../types"
import { createProductCollectionRequestWorkflow } from "../../../../workflows/requests/workflows"
import { VendorCreateProductCollectionRequestType, VendorGetProductCollectionRequestsParamsType } from "./validators"

export async function GET(
  req: AuthenticatedMedusaRequest<VendorGetProductCollectionRequestsParamsType>,
  res: MedusaResponse<VendorRequestListResponse>
): Promise<void> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: entities, metadata } = await query.graph({
    entity: "product_collection",
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
  req: AuthenticatedMedusaRequest<VendorCreateProductCollectionRequestType>,
  res: MedusaResponse<VendorRequestResponse>
): Promise<void> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { result: collection } = await createProductCollectionRequestWorkflow(req.scope).run({
    input: {
      product_collection: req.validatedBody,
      submitter_id: req.auth_context.actor_id,
    },
  })

  const {
    data: [entity],
  } = await query.graph({
    entity: "product_collection",
    fields: req.queryConfig.fields,
    filters: { id: collection.id },
  })

  res.status(201).json({ request: entity })
}

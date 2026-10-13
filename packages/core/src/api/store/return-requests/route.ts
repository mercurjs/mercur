import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes, ReturnRequestActorType } from "@mercurjs/types"

import { createReturnRequestWorkflow } from "../../../workflows/return-request/workflows"
import {
  StoreCreateReturnRequestType,
  StoreGetReturnRequestsParamsType,
} from "./validators"

export const GET = async (
  req: AuthenticatedMedusaRequest<StoreGetReturnRequestsParamsType>,
  res: MedusaResponse<HttpTypes.StoreReturnRequestListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: return_requests, metadata } = await query.graph({
    entity: "return_request",
    fields: req.queryConfig.fields,
    filters: req.filterableFields,
    pagination: req.queryConfig.pagination,
  })

  res.json({
    return_requests,
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<StoreCreateReturnRequestType>,
  res: MedusaResponse<HttpTypes.StoreReturnRequestResponse>
) => {
  const { result } = await createReturnRequestWorkflow.run({
    container: req.scope,
    input: {
      ...req.validatedBody,
      requested_by: req.auth_context.actor_id,
      requested_by_type: ReturnRequestActorType.CUSTOMER,
      customer_id: req.auth_context.actor_id,
    },
  })

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [return_request],
  } = await query.graph({
    entity: "return_request",
    fields: req.queryConfig.fields,
    filters: { id: result.return_request.id },
  })

  res.status(201).json({ return_request })
}

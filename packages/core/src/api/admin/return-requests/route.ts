import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes, ReturnRequestActorType } from "@mercurjs/types"

import { createReturnRequestWorkflow } from "../../../workflows/return-request/workflows"
import {
  AdminCreateReturnRequestType,
  AdminGetReturnRequestsParamsType,
} from "./validators"

export const GET = async (
  req: AuthenticatedMedusaRequest<AdminGetReturnRequestsParamsType>,
  res: MedusaResponse<HttpTypes.AdminReturnRequestListResponse>
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
  req: AuthenticatedMedusaRequest<AdminCreateReturnRequestType>,
  res: MedusaResponse<HttpTypes.AdminReturnRequestPreviewResponse>
) => {
  const { requested_by_type, ...body } = req.validatedBody

  const { result } = await createReturnRequestWorkflow.run({
    container: req.scope,
    input: {
      ...body,
      requested_by: req.auth_context.actor_id,
      requested_by_type:
        requested_by_type === "seller"
          ? ReturnRequestActorType.SELLER
          : ReturnRequestActorType.CUSTOMER,
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

  res.status(201).json({
    return_request,
    order_preview: result.order_preview,
  })
}

import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes, ReturnRequestActorType } from "@mercurjs/types"

import { createReturnRequestWorkflow } from "../../../workflows/return-request/workflows"
import { validateSellerOrder } from "../orders/helpers"
import {
  VendorCreateReturnRequestType,
  VendorGetReturnRequestsParamsType,
} from "./validators"

export const GET = async (
  req: AuthenticatedMedusaRequest<VendorGetReturnRequestsParamsType>,
  res: MedusaResponse<HttpTypes.VendorReturnRequestListResponse>
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
  req: AuthenticatedMedusaRequest<VendorCreateReturnRequestType>,
  res: MedusaResponse<HttpTypes.VendorReturnRequestPreviewResponse>
) => {
  const sellerId = req.seller_context!.seller_id

  await validateSellerOrder(req.scope, sellerId, req.validatedBody.order_id)

  const { result } = await createReturnRequestWorkflow.run({
    container: req.scope,
    input: {
      ...req.validatedBody,
      requested_by: sellerId,
      requested_by_type: ReturnRequestActorType.SELLER,
      seller_id: sellerId,
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

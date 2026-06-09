import { beginClaimOrderWorkflow } from "@medusajs/core-flows"
import { HttpTypes } from "@medusajs/framework/types"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import {
  VendorGetClaimsParamsType,
  VendorPostOrderClaimsReqType,
} from "./validators"

export const GET = async (
  req: AuthenticatedMedusaRequest<VendorGetClaimsParamsType>,
  res: MedusaResponse<HttpTypes.AdminClaimListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: claims, metadata } = await query.graph({
    entity: "order_claim",
    fields: req.queryConfig.fields,
    filters: req.filterableFields,
    pagination: req.queryConfig.pagination,
  })

  res.json({
    claims,
    count: metadata!.count,
    offset: metadata!.skip,
    limit: metadata!.take,
  } as HttpTypes.AdminClaimListResponse)
}

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorPostOrderClaimsReqType>,
  res: MedusaResponse<HttpTypes.AdminClaimOrderResponse>
) => {
  const input = {
    ...req.validatedBody,
    created_by: req.seller_context!.seller_id,
  }

  const { result } = await beginClaimOrderWorkflow(req.scope).run({
    input,
  })

  res.json({
    claim: { id: result.claim_id } as HttpTypes.AdminClaim,
  } as HttpTypes.AdminClaimOrderResponse)
}

import { beginExchangeOrderWorkflow } from "@medusajs/core-flows"
import { HttpTypes } from "@medusajs/framework/types"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import {
  VendorGetExchangesParamsType,
  VendorPostOrderExchangesReqType,
} from "./validators"

export const GET = async (
  req: AuthenticatedMedusaRequest<VendorGetExchangesParamsType>,
  res: MedusaResponse<HttpTypes.AdminExchangeListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: exchanges, metadata } = await query.graph({
    entity: "order_exchange",
    fields: req.queryConfig.fields,
    filters: req.filterableFields,
    pagination: req.queryConfig.pagination,
  })

  res.json({
    exchanges,
    count: metadata!.count,
    offset: metadata!.skip,
    limit: metadata!.take,
  } as HttpTypes.AdminExchangeListResponse)
}

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorPostOrderExchangesReqType>,
  res: MedusaResponse<HttpTypes.AdminExchangeOrderResponse>
) => {
  const input = {
    ...req.validatedBody,
    created_by: req.seller_context!.seller_id,
  }

  const { result } = await beginExchangeOrderWorkflow(req.scope).run({
    input,
  })

  res.json({
    exchange: { id: result.exchange_id } as HttpTypes.AdminExchange,
  } as HttpTypes.AdminExchangeOrderResponse)
}

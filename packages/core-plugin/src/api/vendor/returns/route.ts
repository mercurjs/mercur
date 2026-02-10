import { beginReturnOrderWorkflow } from "@medusajs/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  Modules,
  promiseAll,
} from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { validateSellerOrder } from "../orders/helpers"
import { VendorGetReturnsParamsType, VendorPostReturnsReqType } from "./validators"

export const GET = async (
  req: AuthenticatedMedusaRequest<VendorGetReturnsParamsType>,
  res: MedusaResponse<HttpTypes.VendorReturnListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: returns, metadata } = await query.graph({
    entity: "return",
    fields: req.queryConfig.fields,
    filters: req.filterableFields,
    pagination: req.queryConfig.pagination,
  })

  res.json({
    returns,
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorPostReturnsReqType>,
  res: MedusaResponse<HttpTypes.VendorOrderReturnResponse>
) => {
  await validateSellerOrder(
    req.scope,
    req.auth_context.actor_id,
    req.validatedBody.order_id
  )

  const input = {
    ...req.validatedBody,
    created_by: req.auth_context.actor_id,
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const orderModuleService = req.scope.resolve(Modules.ORDER)

  const workflow = beginReturnOrderWorkflow(req.scope)
  const { result } = await workflow.run({
    input,
  })

  const [order, { data: returnData }] = await promiseAll([
    orderModuleService.retrieveOrder(result.order_id),
    query.graph({
      entity: "return",
      fields: req.queryConfig.fields,
      filters: {
        id: result.return_id,
        ...req.filterableFields,
      },
    }),
  ])

  res.json({
    order,
    return: returnData[0],
  })
}

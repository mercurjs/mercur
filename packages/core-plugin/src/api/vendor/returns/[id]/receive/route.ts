import {
  beginReceiveReturnWorkflow,
  cancelReturnReceiveWorkflow,
} from "@medusajs/core-flows"
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

import { validateSellerReturn } from "../../helpers"
import { VendorPostReceiveReturnsReqType } from "../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorPostReceiveReturnsReqType>,
  res: MedusaResponse<HttpTypes.VendorOrderReturnResponse>
) => {
  const { id } = req.params

  await validateSellerReturn(req.scope, req.auth_context.actor_id, id)

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const orderModuleService = req.scope.resolve(Modules.ORDER)

  const workflow = beginReceiveReturnWorkflow(req.scope)
  const { result } = await workflow.run({
    input: {
      ...req.validatedBody,
      return_id: id,
    },
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

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.VendorReturnDeleteResponse>
) => {
  const { id } = req.params

  await validateSellerReturn(req.scope, req.auth_context.actor_id, id)

  await cancelReturnReceiveWorkflow(req.scope).run({
    input: {
      return_id: id,
    },
  })

  res.status(200).json({
    id,
    object: "return",
    deleted: true,
  })
}

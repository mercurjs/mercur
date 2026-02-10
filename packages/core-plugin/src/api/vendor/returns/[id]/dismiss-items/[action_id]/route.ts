import {
  removeItemReturnActionWorkflow,
  updateReceiveItemReturnRequestWorkflow,
} from "@medusajs/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { validateSellerReturn } from "../../../helpers"
import { VendorPostReturnsDismissItemsActionReqType } from "../../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorPostReturnsDismissItemsActionReqType>,
  res: MedusaResponse<HttpTypes.VendorReturnPreviewResponse>
) => {
  const { id, action_id } = req.params

  await validateSellerReturn(req.scope, req.auth_context.actor_id, id)

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { result } = await updateReceiveItemReturnRequestWorkflow(
    req.scope
  ).run({
    input: {
      data: { ...req.validatedBody },
      return_id: id,
      action_id,
    },
  })

  const {
    data: [orderReturn],
  } = await query.graph({
    entity: "return",
    fields: req.queryConfig.fields,
    filters: {
      id,
      ...req.filterableFields,
    },
  })

  res.json({
    order_preview: result,
    return: orderReturn,
  })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.VendorReturnPreviewResponse>
) => {
  const { id, action_id } = req.params

  await validateSellerReturn(req.scope, req.auth_context.actor_id, id)

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { result: orderPreview } = await removeItemReturnActionWorkflow(
    req.scope
  ).run({
    input: {
      return_id: id,
      action_id,
    },
  })

  const {
    data: [orderReturn],
  } = await query.graph({
    entity: "return",
    fields: req.queryConfig.fields,
    filters: {
      id,
      ...req.filterableFields,
    },
  })

  res.json({
    order_preview: orderPreview,
    return: orderReturn,
  })
}

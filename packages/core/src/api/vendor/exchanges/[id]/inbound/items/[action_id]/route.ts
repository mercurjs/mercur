import {
  removeItemReturnActionWorkflow,
  updateRequestItemReturnWorkflow,
} from "@medusajs/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { HttpTypes } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { VendorPostExchangesRequestItemsReturnActionReqType } from "../../../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorPostExchangesRequestItemsReturnActionReqType>,
  res: MedusaResponse<{
    order_preview: HttpTypes.AdminOrderPreview
  }>
) => {
  const { id, action_id } = req.params

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [exchange],
  } = await query.graph({
    entity: "order_exchange",
    filters: { id },
    fields: ["id", "return_id"],
  })

  const { result } = await updateRequestItemReturnWorkflow(req.scope).run({
    input: {
      data: { ...req.validatedBody },
      return_id: exchange.return_id,
      exchange_id: exchange.id,
      action_id,
    },
  })

  res.json({
    order_preview: result as unknown as HttpTypes.AdminOrderPreview,
  })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<{
    order_preview: HttpTypes.AdminOrderPreview
  }>
) => {
  const { id, action_id } = req.params

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [exchange],
  } = await query.graph({
    entity: "order_exchange",
    filters: { id },
    fields: ["id", "return_id"],
  })

  const { result } = await removeItemReturnActionWorkflow(req.scope).run({
    input: {
      return_id: exchange.return_id,
      action_id,
    },
  })

  res.json({
    order_preview: result as unknown as HttpTypes.AdminOrderPreview,
  })
}

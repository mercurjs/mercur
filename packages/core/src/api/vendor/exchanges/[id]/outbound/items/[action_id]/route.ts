import {
  removeItemExchangeActionWorkflow,
  updateExchangeAddItemWorkflow,
} from "@medusajs/core-flows"
import { HttpTypes } from "@medusajs/framework/types"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import { VendorPostExchangesItemsActionReqType } from "../../../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorPostExchangesItemsActionReqType>,
  res: MedusaResponse<{
    order_preview: HttpTypes.AdminOrderPreview
  }>
) => {
  const { id, action_id } = req.params

  const { result } = await updateExchangeAddItemWorkflow(req.scope).run({
    input: {
      data: { ...req.validatedBody },
      exchange_id: id,
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

  const { result } = await removeItemExchangeActionWorkflow(req.scope).run({
    input: {
      exchange_id: id,
      action_id,
    },
  })

  res.json({
    order_preview: result as unknown as HttpTypes.AdminOrderPreview,
  })
}

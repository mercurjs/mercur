import { cancelBeginOrderExchangeWorkflow } from "@medusajs/core-flows"
import { HttpTypes } from "@medusajs/framework/types"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import { confirmExchangeRequestWorkflow } from "../../../../../workflows/order/workflows/confirm-exchange-request"

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<{
    order_preview: HttpTypes.AdminOrderPreview
  }>
) => {
  const { id } = req.params

  // Mercur wrapper: runs Medusa's `confirmExchangeRequestWorkflow` then
  // adjusts outbound reservations through `offer.inventory_item_link[]
  // .required_quantity` so bundle-style offers don't under-reserve.
  const { result } = await confirmExchangeRequestWorkflow(req.scope).run({
    input: {
      exchange_id: id,
      confirmed_by: req.seller_context!.seller_id,
    },
  })

  res.json({
    order_preview: result as unknown as HttpTypes.AdminOrderPreview,
  })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminExchangeDeleteResponse>
) => {
  const { id } = req.params

  await cancelBeginOrderExchangeWorkflow(req.scope).run({
    input: { exchange_id: id },
  })

  res.status(200).json({
    id,
    object: "exchange",
    deleted: true,
  })
}

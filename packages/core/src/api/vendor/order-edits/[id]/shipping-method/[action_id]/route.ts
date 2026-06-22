import {
  removeOrderEditShippingMethodWorkflow,
  updateOrderEditShippingMethodWorkflow,
} from "@medusajs/core-flows"
import { HttpTypes } from "@medusajs/framework/types"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import { VendorPostOrderEditsShippingActionReqType } from "../../../validators"

/**
 * `POST /vendor/order-edits/:id/shipping-method/:action_id` — mirrors
 * `POST /admin/order-edits/:id/shipping-method/:action_id`. Updates
 * an existing add-shipping-method action.
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<VendorPostOrderEditsShippingActionReqType>,
  res: MedusaResponse<HttpTypes.AdminOrderEditPreviewResponse>
) => {
  const { id, action_id } = req.params

  const { result } = await updateOrderEditShippingMethodWorkflow(req.scope).run(
    {
      input: {
        data: { ...req.validatedBody },
        order_id: id,
        action_id,
      },
    }
  )

  res.json({
    order_preview: result as unknown as HttpTypes.AdminOrderPreview,
  })
}

/**
 * `DELETE /vendor/order-edits/:id/shipping-method/:action_id` —
 * removes the shipping-method action from the draft.
 */
export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminOrderEditPreviewResponse>
) => {
  const { id, action_id } = req.params

  const { result: orderPreview } = await removeOrderEditShippingMethodWorkflow(
    req.scope
  ).run({
    input: {
      order_id: id,
      action_id,
    },
  })

  res.json({
    order_preview: orderPreview as unknown as HttpTypes.AdminOrderPreview,
  })
}

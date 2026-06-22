import {
  removeItemOrderEditActionWorkflow,
  updateOrderEditAddItemWorkflow,
} from "@medusajs/core-flows"
import { HttpTypes } from "@medusajs/framework/types"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import { VendorPostOrderEditsItemsActionReqType } from "../../../validators"

/**
 * `POST /vendor/order-edits/:id/items/:action_id` — mirrors
 * `POST /admin/order-edits/:id/items/:action_id`. Updates an
 * existing add-item action on the draft.
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<VendorPostOrderEditsItemsActionReqType>,
  res: MedusaResponse<HttpTypes.AdminOrderEditPreviewResponse>
) => {
  const { id, action_id } = req.params

  const { result } = await updateOrderEditAddItemWorkflow(req.scope).run({
    input: {
      data: { ...req.validatedBody },
      order_id: id,
      action_id,
    },
  })

  res.json({
    order_preview: result as unknown as HttpTypes.AdminOrderPreview,
  })
}

/**
 * `DELETE /vendor/order-edits/:id/items/:action_id` — removes the
 * add-item action from the draft.
 */
export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminOrderEditPreviewResponse>
) => {
  const { id, action_id } = req.params

  const { result: orderPreview } = await removeItemOrderEditActionWorkflow(
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

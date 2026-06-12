import { HttpTypes } from "@medusajs/framework/types"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import { confirmOrderEditRequestWorkflow } from "../../../../../workflows/order/workflows"

/**
 * Mercur override of Medusa's `POST /admin/order-edits/:id/confirm`.
 *
 * Calls the Mercur wrapper around `confirmOrderEditRequestWorkflow` so
 * reservations created on added / qty-bumped items are adjusted to the
 * offer's `inventory_item_link.required_quantity` — same fix the vendor
 * confirm route uses. `confirmed_by` is stamped with `auth_context.actor_id`
 * (admin equivalent of the vendor route's `seller_context.seller_id`).
 */
export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminOrderEditPreviewResponse>
) => {
  const { id } = req.params

  const { result } = await confirmOrderEditRequestWorkflow(req.scope).run({
    input: {
      order_id: id,
      confirmed_by: req.auth_context.actor_id,
    },
  })

  res.json({
    order_preview: result as unknown as HttpTypes.AdminOrderPreview,
  })
}

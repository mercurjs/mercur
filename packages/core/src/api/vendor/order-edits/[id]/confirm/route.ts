import { HttpTypes } from "@medusajs/framework/types"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import { confirmOrderEditRequestWorkflow } from "../../../../../workflows/order/workflows"

/**
 * `POST /vendor/order-edits/:id/confirm` — mirrors
 * `POST /admin/order-edits/:id/confirm`. Flips a requested edit to
 * `confirmed` and applies its actions. `confirmed_by` is stamped with
 * the seller's id (vendor equivalent of admin's `actor_id`).
 *
 * Calls the Mercur wrapper around `confirmOrderEditRequestWorkflow` so
 * reservations created on added / qty-bumped items are adjusted to the
 * offer's `inventory_item_link.required_quantity` (matches the exchange
 * and claim confirm flows).
 */
export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminOrderEditPreviewResponse>
) => {
  const { id } = req.params

  const { result } = await confirmOrderEditRequestWorkflow(req.scope).run({
    input: {
      order_id: id,
      confirmed_by: req.seller_context!.seller_id,
    },
  })

  res.json({
    order_preview: result as unknown as HttpTypes.AdminOrderPreview,
  })
}

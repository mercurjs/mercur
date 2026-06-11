import { HttpTypes } from "@medusajs/framework/types"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import { confirmOrderEditRequestWorkflow } from "../../../../../workflows/order/workflows"

/**
 * `POST /admin/order-edits/:id/confirm` — Mercur override of Medusa's
 * default. Swaps in the wrapper workflow so reservations get created
 * for offer-backed lines added through the edit; Medusa's stock
 * workflow only reserves against `variant.inventory_items`, which is
 * empty for Mercur offers.
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

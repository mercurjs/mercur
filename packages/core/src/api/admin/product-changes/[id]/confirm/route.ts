import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import { confirmProductEditWorkflow } from "../../../../../workflows/product-edit/workflows/confirm-product-edit"
import { AdminConfirmProductChangeType } from "../../validators"

/**
 * Admin-side confirm of a pending `ProductChange`. Mirrors Medusa's
 * `POST /admin/order-edits/:id/confirm`. Validates and applies all staged
 * actions to the underlying product in a single transaction, then marks
 * the change `CONFIRMED`. An optional `internal_note` in the body is
 * persisted onto the `ProductChange.internal_note` field.
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<AdminConfirmProductChangeType>,
  res: MedusaResponse
) => {
  await confirmProductEditWorkflow(req.scope).run({
    input: {
      product_change_id: req.params.id,
      actor_id: req.auth_context?.actor_id,
      internal_note: req.validatedBody?.internal_note,
    },
  })

  res.json({
    id: req.params.id,
    object: "product_change",
    deleted: true,
  })
}

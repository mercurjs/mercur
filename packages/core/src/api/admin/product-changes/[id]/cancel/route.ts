import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

import { cancelProductEditWorkflow } from "../../../../../workflows/product-edit/workflows/cancel-product-edit"
import { AdminCancelProductChangeType } from "../../validators"

/**
 * Admin-side cancel of a pending `ProductChange`. Mirrors Medusa's
 * `POST /admin/order-edits/:id` DELETE / cancel-begin-order-edit pattern.
 * Marks the change `CANCELED` (no actions are applied to the product). An
 * optional `internal_note` in the body is persisted onto
 * `ProductChange.internal_note`.
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<AdminCancelProductChangeType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  await cancelProductEditWorkflow(req.scope).run({
    input: {
      product_change_id: req.params.id,
      actor_id: req.auth_context?.actor_id,
      internal_note: req.validatedBody?.internal_note,
    },
  })

  const {
    data: [product_change],
  } = await query.graph({
    entity: "product_change",
    fields: ["*", "actions.*"],
    filters: { id: req.params.id },
  })

  if (!product_change) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product change with id ${req.params.id} was not found`
    )
  }

  res.json({ product_change })
}

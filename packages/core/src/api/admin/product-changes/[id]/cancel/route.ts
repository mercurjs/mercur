import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

import { cancelProductChangeWorkflow } from "../../../../../workflows/product-edit/workflows/cancel-product-change"
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

  await cancelProductChangeWorkflow(req.scope).run({
    input: {
      id: req.params.id,
      canceled_by: req.auth_context?.actor_id,
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

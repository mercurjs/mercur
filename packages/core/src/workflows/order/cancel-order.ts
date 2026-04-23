import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { cancelOrderWorkflow as medusaCancelOrderWorkflow } from "@medusajs/medusa/core-flows"

import { validateCancelStep } from "./steps/validate-cancel"

export type MercurCancelOrderInput = {
  order_id: string
  canceled_by?: string
}

/**
 * Mercur-specific order cancel wrapper. Enforces the marketplace invariant
 * (no cancel after any item has been fulfilled) before delegating to the
 * Medusa core-flow.
 *
 * Used by:
 *   - vendor cancel route (`/vendor/orders/:id/cancel`)
 *   - admin direct callers (admin route is Medusa-provided; the middleware
 *     `validateCancelOrderMiddleware` enforces the same predicate before the
 *     Medusa handler runs).
 */
export const mercurCancelOrderWorkflow = createWorkflow(
  "mercur-cancel-order",
  function (input: MercurCancelOrderInput) {
    validateCancelStep({ order_id: input.order_id })

    medusaCancelOrderWorkflow.runAsStep({
      input: {
        order_id: input.order_id,
        canceled_by: input.canceled_by,
      },
    })

    return new WorkflowResponse(void 0)
  }
)

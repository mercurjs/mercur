import {
  createWorkflow,
  createHook,
  WorkflowResponse,
  transform,
} from "@medusajs/framework/workflows-sdk"
import {
  emitEventStep,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows"

import { ProductWorkflowEvents } from "../../product/events"
import {
  declineProductChangeStep,
  validateProductChangePendingStep,
} from "../steps"

export const declineProductEditWorkflowId = "decline-product-edit"

type DeclineProductEditWorkflowInput = {
  product_change_id: string
  declined_reason?: string
  actor_id?: string
}

/**
 * Admin-side decline of a pending product change. Mirrors Medusa's
 * `declineOrderChange` flow — sets the change to `DECLINED` with an optional
 * `declined_reason` note. Distinct from `reject-product`, which rejects the
 * product itself.
 */
export const declineProductEditWorkflow = createWorkflow(
  declineProductEditWorkflowId,
  function (input: DeclineProductEditWorkflowInput) {
    const { data: changes } = useQueryGraphStep({
      entity: "product_change",
      fields: ["id", "product_id", "status"],
      filters: { id: input.product_change_id },
      options: { throwIfKeyNotFound: true },
    })

    const product_change = transform({ changes }, ({ changes }) => changes[0])

    validateProductChangePendingStep({ product_change })

    const declineInput = transform(
      { product_change, input },
      ({ product_change, input }) => ({
        product_change,
        declined_by: input.actor_id,
        declined_reason: input.declined_reason,
      })
    )

    declineProductChangeStep(declineInput)

    emitEventStep({
      eventName: ProductWorkflowEvents.EDIT_DECLINED,
      data: transform(
        { product_change },
        ({ product_change }) => ({
          id: product_change.product_id,
          change_id: product_change.id,
        })
      ),
    })

    const productEditDeclined = createHook("productEditDeclined", {
      product_change_id: input.product_change_id,
    })

    return new WorkflowResponse(void 0, { hooks: [productEditDeclined] })
  }
)

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
  cancelProductChangeStep,
  validateProductChangePendingStep,
} from "../steps"

export const cancelProductEditWorkflowId = "cancel-product-edit"

type CancelProductEditWorkflowInput = {
  product_change_id: string
  actor_id?: string
  /**
   * Note persisted onto `ProductChange.internal_note` alongside the
   * cancellation. Used to record why the change was abandoned.
   */
  internal_note?: string
}

/**
 * Cancels (abandons) a pending product change. Counterpart to Medusa's
 * `cancelBeginOrderEditWorkflow` — used when the creator (typically the
 * seller) wants to drop staged work without admin involvement.
 */
export const cancelProductEditWorkflow = createWorkflow(
  cancelProductEditWorkflowId,
  function (input: CancelProductEditWorkflowInput) {
    const { data: changes } = useQueryGraphStep({
      entity: "product_change",
      fields: ["id", "product_id", "status"],
      filters: { id: input.product_change_id },
      options: { throwIfKeyNotFound: true },
    })

    const product_change = transform({ changes }, ({ changes }) => changes[0])

    validateProductChangePendingStep({ product_change })

    cancelProductChangeStep({
      id: input.product_change_id,
      canceled_by: input.actor_id,
      internal_note: input.internal_note,
    })

    emitEventStep({
      eventName: ProductWorkflowEvents.EDIT_CANCELED,
      data: transform(
        { product_change },
        ({ product_change }) => ({
          id: product_change.product_id,
          change_id: product_change.id,
        })
      ),
    })

    const productEditCanceled = createHook("productEditCanceled", {
      product_change_id: input.product_change_id,
    })

    return new WorkflowResponse(void 0, { hooks: [productEditCanceled] })
  }
)

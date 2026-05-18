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
import { confirmProductChangesStep } from "../steps"
import { ProductChangeStatus } from "@mercurjs/types"

export const confirmProductEditWorkflowId = "confirm-product-edit"

type ConfirmProductEditWorkflowInput = {
  product_change_id: string
  actor_id?: string
  /**
   * Operator note persisted onto the `ProductChange.internal_note` field
   * alongside the confirmation. Used to record why the change was accepted.
   */
  internal_note?: string
}

/**
 * Confirms a pending `ProductChange`. `confirmProductChange` in the product
 * module validates state, marks the change `CONFIRMED`, and applies all of
 * its actions to the underlying product in a single transaction — this
 * workflow only resolves the product_id (for the event payload) and runs
 * the step.
 */
export const confirmProductEditWorkflow = createWorkflow(
  confirmProductEditWorkflowId,
  function (input: ConfirmProductEditWorkflowInput) {
    const { data: changes } = useQueryGraphStep({
      entity: "product_change",
      fields: ["id", "product_id"],
      filters: { id: input.product_change_id, status: ProductChangeStatus.PENDING },
      options: { throwIfKeyNotFound: true },
    })

    const confirmInput = transform({ input }, ({ input }) => [
      {
        id: input.product_change_id,
        confirmed_by: input.actor_id,
        internal_note: input.internal_note,
      },
    ])

    confirmProductChangesStep(confirmInput)

    emitEventStep({
      eventName: ProductWorkflowEvents.EDIT_CONFIRMED,
      data: transform({ changes, input }, ({ changes, input }) => ({
        id: changes[0].product_id,
        change_id: input.product_change_id,
      })),
    })

    const productEditConfirmed = createHook("productEditConfirmed", {
      product_change_id: input.product_change_id,
    })

    return new WorkflowResponse(void 0, { hooks: [productEditConfirmed] })
  }
)

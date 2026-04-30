import {
  createWorkflow,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { FeatureFlag } from "@medusajs/framework/utils"
import { emitEventStep } from "@medusajs/medusa/core-flows"
import { MercurFeatureFlags } from "@mercurjs/types"

import { confirmProductChangesStep } from "../steps"
import { ProductWorkflowEvents } from "../../product/events"

export const autoConfirmProductChangeWorkflowId =
  "auto-confirm-product-change"

type AutoConfirmProductChangeWorkflowInput = {
  product_id: string
  product_change_id: string
  actor_id?: string
  internal_note?: string
}

/**
 * When the `product_request` feature flag is disabled, the change-review
 * pipeline is bypassed: the pending `ProductChange` opened by the surrounding
 * workflow is auto-confirmed immediately and an `EDIT_CONFIRMED` event is
 * emitted. No-op when the flag is enabled. Intended to be invoked via
 * `runAsStep` from the per-action `product-edit-*` workflows.
 */
export const autoConfirmProductChangeWorkflow = createWorkflow(
  autoConfirmProductChangeWorkflowId,
  function (input: AutoConfirmProductChangeWorkflowInput) {
    when(
      { input },
      () => !FeatureFlag.isFeatureEnabled(MercurFeatureFlags.PRODUCT_REQUEST)
    ).then(() => {
      confirmProductChangesStep(
        transform({ input }, ({ input }) => [
          {
            id: input.product_change_id,
            confirmed_by: input.actor_id,
            internal_note: input.internal_note,
          },
        ])
      )

      emitEventStep({
        eventName: ProductWorkflowEvents.EDIT_CONFIRMED,
        data: transform({ input }, ({ input }) => ({
          id: input.product_id,
          change_id: input.product_change_id,
        })),
      })
    })

    return new WorkflowResponse(void 0)
  }
)

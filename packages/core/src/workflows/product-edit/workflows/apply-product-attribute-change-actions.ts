import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  createRemoteLinkStep,
  dismissRemoteLinkStep,
} from "@medusajs/medusa/core-flows"

import { applyAttributeChangeActionsStep } from "../../product-attribute/steps"

export type ApplyProductAttributeChangeActionsWorkflowInput = {
  add_actions: Array<{
    product_id: string
    attribute_id: string
    attribute_value_ids: string[]
  }>
  remove_actions: Array<{
    product_id: string
    attribute_id: string
  }>
}

export const applyProductAttributeChangeActionsWorkflowId =
  "apply-product-attribute-change-actions"

/**
 * SPEC-014 §H: confirm-time dispatcher for `ATTRIBUTE_ADD` / `ATTRIBUTE_REMOVE`
 * actions. Rebuilt on the native-option model — axis attributes attach/detach
 * their native mirror option (via {@link applyAttributeChangeActionsStep}) and
 * non-axis selections are value-linked. Removes run before adds so a single
 * change can re-link the same attribute with a different value set.
 */
export const applyProductAttributeChangeActionsWorkflow = createWorkflow(
  applyProductAttributeChangeActionsWorkflowId,
  function (input: ApplyProductAttributeChangeActionsWorkflowInput) {
    const applied = applyAttributeChangeActionsStep({
      add_actions: input.add_actions,
      remove_actions: input.remove_actions,
    })

    dismissRemoteLinkStep(
      transform({ applied }, ({ applied }) => applied.dismiss_value_links),
    ).config({ name: "pa-apply-change-dismiss-value-links" })

    createRemoteLinkStep(
      transform({ applied }, ({ applied }) => applied.create_value_links),
    ).config({ name: "pa-apply-change-create-value-links" })

    return new WorkflowResponse(void 0)
  },
)

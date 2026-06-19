import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"

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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function (_input: ApplyProductAttributeChangeActionsWorkflowInput) {
    // TODO(approval-queue): re-implement on the native-option batch engine
    // (createAndLinkProductAttributesToProductWorkflow), grouping actions per
    // product. Dormant — admin + vendor apply attribute edits directly via the
    // batch endpoint, so no pending ATTRIBUTE_ADD/REMOVE actions reach here.
    return new WorkflowResponse(void 0)
  },
)

import {
  createWorkflow,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  ProductAttributeBatchAdd,
  ProductAttributeBatchUpdate,
} from "@mercurjs/types"

import { createAndLinkProductAttributesToProductWorkflow } from "../../product-attribute"

export type ApplyProductAttributeChangeActionsWorkflowInput = {
  /** The product whose attribute selection is being reconciled. */
  product_id: string
  /** Attributes to attach. See {@link ProductAttributeBatchAdd}. */
  add: ProductAttributeBatchAdd[]
  /** The ids of the attributes to detach from the product. */
  remove: string[]
  /** The attribute selections to mutate. See {@link ProductAttributeBatchUpdate}. */
  update: ProductAttributeBatchUpdate[]
}

export const applyProductAttributeChangeActionsWorkflowId =
  "apply-product-attribute-change-actions"

/**
 * SPEC-014 §H: confirm-time dispatcher for `ATTRIBUTE_ADD` / `ATTRIBUTE_REMOVE`
 * / `ATTRIBUTE_UPDATE` actions. The caller
 * (`applyProductChangeActionsWorkflow`) reconstructs a single
 * `ProductAttributeBatchInput` per product from the pending actions' `details`;
 * this workflow re-runs the SPEC-014 batch engine
 * (`createAndLinkProductAttributesToProductWorkflow`) verbatim, which already
 * applies in the safe order **remove → add → update**. Guarded so a change with
 * no attribute actions is a no-op.
 */
export const applyProductAttributeChangeActionsWorkflow = createWorkflow(
  applyProductAttributeChangeActionsWorkflowId,
  function (input: ApplyProductAttributeChangeActionsWorkflowInput) {
    when(
      { input },
      ({ input }) =>
        (input.add?.length ?? 0) > 0 ||
        (input.remove?.length ?? 0) > 0 ||
        (input.update?.length ?? 0) > 0,
    ).then(() => {
      createAndLinkProductAttributesToProductWorkflow.runAsStep({
        input: transform({ input }, ({ input }) => ({
          product_id: input.product_id,
          add: input.add,
          remove: input.remove,
          update: input.update,
        })),
      })
    })

    return new WorkflowResponse(void 0)
  },
)

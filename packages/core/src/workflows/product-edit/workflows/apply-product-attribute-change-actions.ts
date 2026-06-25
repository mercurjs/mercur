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
  product_id: string
  add: ProductAttributeBatchAdd[]
  remove: string[]
  update: ProductAttributeBatchUpdate[]
}

export const applyProductAttributeChangeActionsWorkflowId =
  "apply-product-attribute-change-actions"

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

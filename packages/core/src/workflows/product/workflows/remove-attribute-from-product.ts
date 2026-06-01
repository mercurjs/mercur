import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"

import { removeAttributeFromProductStep } from "../steps/remove-attribute-from-product"

export const removeAttributeFromProductWorkflowId =
  "mercur-remove-attribute-from-product"

type RemoveAttributeFromProductWorkflowInput = {
  product_id: string
  attribute_id: string
}

export const removeAttributeFromProductWorkflow = createWorkflow(
  removeAttributeFromProductWorkflowId,
  function (input: RemoveAttributeFromProductWorkflowInput) {
    removeAttributeFromProductStep(input)

    emitEventStep({
      eventName: "product_attribute.deleted",
      data: transform({ input }, ({ input }) => [
        { id: input.attribute_id },
      ]),
    })

    return new WorkflowResponse(void 0)
  }
)

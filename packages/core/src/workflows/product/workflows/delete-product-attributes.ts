import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"

import { ProductAttributeWorkflowEvents } from "../events"
import { deleteProductAttributesStep } from "../steps/delete-product-attributes"

export const deleteProductAttributesWorkflowId = "delete-product-attributes"

type DeleteProductAttributesWorkflowInput = {
  ids: string[]
}

export const deleteProductAttributesWorkflow = createWorkflow(
  deleteProductAttributesWorkflowId,
  function (input: DeleteProductAttributesWorkflowInput) {
    deleteProductAttributesStep(input.ids)

    emitEventStep({
      eventName: ProductAttributeWorkflowEvents.DELETED,
      data: transform({ input }, ({ input }) =>
        input.ids.map((id) => ({ id }))
      ),
    })

    return new WorkflowResponse(void 0)
  }
)

import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"

import { ProductAttributeValueWorkflowEvents } from "../events"
import { deleteProductAttributeValuesStep } from "../steps/delete-product-attribute-values"

export const deleteProductAttributeValuesWorkflowId =
  "delete-product-attribute-values"

type DeleteProductAttributeValuesWorkflowInput = {
  ids: string[]
}

export const deleteProductAttributeValuesWorkflow = createWorkflow(
  deleteProductAttributeValuesWorkflowId,
  function (input: DeleteProductAttributeValuesWorkflowInput) {
    deleteProductAttributeValuesStep(input.ids)

    emitEventStep({
      eventName: ProductAttributeValueWorkflowEvents.DELETED,
      data: transform({ input }, ({ input }) =>
        input.ids.map((id) => ({ id }))
      ),
    })

    return new WorkflowResponse(void 0)
  }
)

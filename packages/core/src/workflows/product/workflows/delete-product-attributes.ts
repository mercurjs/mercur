import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"

import { deleteProductAttributesStep } from "../steps/delete-product-attributes"
import { validateDeleteProductAttributesStep } from "../steps/validate-delete-product-attributes"

export const deleteProductAttributesWorkflowId = "mercur-delete-product-attributes"

type DeleteProductAttributesWorkflowInput = {
  ids: string[]
}

export const deleteProductAttributesWorkflow = createWorkflow(
  deleteProductAttributesWorkflowId,
  function (input: DeleteProductAttributesWorkflowInput) {
    validateDeleteProductAttributesStep(input)

    deleteProductAttributesStep(input.ids)

    emitEventStep({
      eventName: "product_attribute.deleted",
      data: transform({ input }, ({ input }) =>
        input.ids.map((id) => ({ id }))
      ),
    })

    return new WorkflowResponse(void 0)
  }
)

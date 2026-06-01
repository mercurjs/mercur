import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"

import { deleteProductAttributeValuesStep } from "../steps/delete-product-attribute-values"
import { validateDeleteProductAttributeValuesStep } from "../steps/validate-delete-product-attribute-values"

export const deleteProductAttributeValuesWorkflowId =
  "mercur-delete-product-attribute-values"

type DeleteProductAttributeValuesWorkflowInput = {
  ids: string[]
}

export const deleteProductAttributeValuesWorkflow = createWorkflow(
  deleteProductAttributeValuesWorkflowId,
  function (input: DeleteProductAttributeValuesWorkflowInput) {
    validateDeleteProductAttributeValuesStep(input)

    deleteProductAttributeValuesStep(input.ids)

    emitEventStep({
      eventName: "product_attribute_value.deleted",
      data: transform({ input }, ({ input }) =>
        input.ids.map((id) => ({ id }))
      ),
    })

    return new WorkflowResponse(void 0)
  }
)

import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"
import { UpdateProductAttributeValueDTO } from "@mercurjs/types"

import { ProductAttributeValueWorkflowEvents } from "../events"
import { updateProductAttributeValuesStep } from "../steps/update-product-attribute-values"

export const updateProductAttributeValuesWorkflowId =
  "update-product-attribute-values"

type UpdateProductAttributeValuesWorkflowInput = {
  selector: Record<string, unknown>
  update: UpdateProductAttributeValueDTO
}

export const updateProductAttributeValuesWorkflow = createWorkflow(
  updateProductAttributeValuesWorkflowId,
  function (input: UpdateProductAttributeValuesWorkflowInput) {
    const values = updateProductAttributeValuesStep(input)

    emitEventStep({
      eventName: ProductAttributeValueWorkflowEvents.UPDATED,
      data: transform({ values }, ({ values }) =>
        values.map((v) => ({ id: v.id }))
      ),
    })

    return new WorkflowResponse(values)
  }
)

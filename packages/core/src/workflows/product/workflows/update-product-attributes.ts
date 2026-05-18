import {
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"
import { UpdateProductAttributeDTO } from "@mercurjs/types"

import { ProductAttributeWorkflowEvents } from "../events"
import { updateProductAttributesStep } from "../steps/update-product-attributes"
import { createIdempotentWorkflow } from "../../utils/create-idempotent-workflow"

export const updateProductAttributesWorkflowId = "update-product-attributes"

type UpdateProductAttributesWorkflowInput = {
  selector: Record<string, unknown>
  update: UpdateProductAttributeDTO
}

export const updateProductAttributesWorkflow = createIdempotentWorkflow(
  updateProductAttributesWorkflowId,
  function (input: UpdateProductAttributesWorkflowInput) {
    const attributes = updateProductAttributesStep(input)

    emitEventStep({
      eventName: ProductAttributeWorkflowEvents.UPDATED,
      data: transform({ attributes }, ({ attributes }) =>
        attributes.map((a) => ({ id: a.id }))
      ),
    })

    return new WorkflowResponse(attributes)
  }
)

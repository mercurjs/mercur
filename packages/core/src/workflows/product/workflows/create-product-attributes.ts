import {
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"
import { CreateProductAttributeDTO } from "@mercurjs/types"

import { ProductAttributeWorkflowEvents } from "../events"
import { createProductAttributesStep } from "../steps/create-product-attributes"
import { createIdempotentWorkflow } from "../../utils/create-idempotent-workflow"

export const createProductAttributesWorkflowId = "create-product-attributes"

type CreateProductAttributesWorkflowInput = {
  attributes: CreateProductAttributeDTO[]
}

export const createProductAttributesWorkflow = createIdempotentWorkflow(
  createProductAttributesWorkflowId,
  function (input: CreateProductAttributesWorkflowInput) {
    const attributes = createProductAttributesStep(input.attributes)

    emitEventStep({
      eventName: ProductAttributeWorkflowEvents.CREATED,
      data: transform({ attributes }, ({ attributes }) =>
        attributes.map((a) => ({ id: a.id }))
      ),
    })

    return new WorkflowResponse(attributes)
  }
)

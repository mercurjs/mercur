import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"

import { ProductAttributeWorkflowEvents } from "../events"
import { batchProductAttributesStep } from "../steps/batch-product-attributes"

export const batchProductAttributesWorkflowId = "batch-product-attributes"

type BatchProductAttributesWorkflowInput = {
  product_id: string
  create?: {
    attribute_id: string
    attribute_value_ids?: string[]
    values?: string[]
  }[]
  delete?: string[]
}

export const batchProductAttributesWorkflow = createWorkflow(
  batchProductAttributesWorkflowId,
  function (input: BatchProductAttributesWorkflowInput) {
    batchProductAttributesStep(input)

    const createdEvents = transform({ input }, ({ input }) =>
      (input.create ?? []).map((c) => ({ id: c.attribute_id }))
    )

    const deletedEvents = transform({ input }, ({ input }) =>
      (input.delete ?? []).map((id) => ({ id }))
    )

    emitEventStep({
      eventName: ProductAttributeWorkflowEvents.UPDATED,
      data: transform(
        { createdEvents, deletedEvents },
        ({ createdEvents, deletedEvents }) => [
          ...createdEvents,
          ...deletedEvents,
        ]
      ),
    })

    return new WorkflowResponse(void 0)
  }
)

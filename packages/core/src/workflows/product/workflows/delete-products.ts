import {
  createWorkflow,
  WorkflowResponse,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"

import { deleteProductsStep } from "../steps"

export const deleteProductsWorkflowId = "mercur-delete-products"

type DeleteProductsWorkflowInput = {
  ids: string[]
}

export const deleteProductsWorkflow = createWorkflow(
  deleteProductsWorkflowId,
  function (input: DeleteProductsWorkflowInput) {
    deleteProductsStep(input.ids)

    const eventData = transform({ input }, ({ input }) =>
      input.ids.map((id) => ({ id }))
    )

    emitEventStep({
      eventName: "product.deleted",
      data: eventData,
    })

    return new WorkflowResponse(void 0)
  }
)

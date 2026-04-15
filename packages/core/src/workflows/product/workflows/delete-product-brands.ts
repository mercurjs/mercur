import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"

import { ProductBrandWorkflowEvents } from "../events"
import { deleteProductBrandsStep } from "../steps/delete-product-brands"

export const deleteProductBrandsWorkflowId = "delete-product-brands"

type DeleteProductBrandsWorkflowInput = {
  ids: string[]
}

export const deleteProductBrandsWorkflow = createWorkflow(
  deleteProductBrandsWorkflowId,
  function (input: DeleteProductBrandsWorkflowInput) {
    deleteProductBrandsStep(input.ids)

    const eventData = transform({ input }, ({ input }) =>
      input.ids.map((id) => ({ id }))
    )

    emitEventStep({
      eventName: ProductBrandWorkflowEvents.DELETED,
      data: eventData,
    })

    return new WorkflowResponse(void 0)
  }
)

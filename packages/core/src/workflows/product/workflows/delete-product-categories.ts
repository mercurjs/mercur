import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"

import { ProductCategoryWorkflowEvents } from "../events"
import { deleteProductCategoriesStep } from "../steps/delete-product-categories"

export const deleteProductCategoriesWorkflowId = "delete-product-categories"

type DeleteProductCategoriesWorkflowInput = {
  ids: string[]
}

export const deleteProductCategoriesWorkflow = createWorkflow(
  deleteProductCategoriesWorkflowId,
  function (input: DeleteProductCategoriesWorkflowInput) {
    deleteProductCategoriesStep(input.ids)

    emitEventStep({
      eventName: ProductCategoryWorkflowEvents.DELETED,
      data: transform({ input }, ({ input }) =>
        input.ids.map((id) => ({ id }))
      ),
    })

    return new WorkflowResponse(void 0)
  }
)

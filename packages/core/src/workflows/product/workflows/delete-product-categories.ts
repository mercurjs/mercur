import {
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"

import { ProductCategoryWorkflowEvents } from "../events"
import { deleteProductCategoriesStep } from "../steps/delete-product-categories"
import { createIdempotentWorkflow } from "../../utils/create-idempotent-workflow"

export const deleteProductCategoriesWorkflowId = "delete-product-categories"

type DeleteProductCategoriesWorkflowInput = {
  ids: string[]
}

export const deleteProductCategoriesWorkflow = createIdempotentWorkflow(
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

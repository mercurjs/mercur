import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"
import { UpdateProductCategoryDTO } from "@mercurjs/types"

import { ProductCategoryWorkflowEvents } from "../events"
import { updateProductCategoriesStep } from "../steps/update-product-categories"

export const updateProductCategoriesWorkflowId = "update-product-categories"

type UpdateProductCategoriesWorkflowInput = {
  categories: (UpdateProductCategoryDTO & { id: string })[]
}

export const updateProductCategoriesWorkflow = createWorkflow(
  updateProductCategoriesWorkflowId,
  function (input: UpdateProductCategoriesWorkflowInput) {
    const categories = updateProductCategoriesStep(input.categories)

    emitEventStep({
      eventName: ProductCategoryWorkflowEvents.UPDATED,
      data: transform({ categories }, ({ categories }) =>
        categories.map((c) => ({ id: c.id }))
      ),
    })

    return new WorkflowResponse(categories)
  }
)

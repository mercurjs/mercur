import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"
import { CreateProductCategoryDTO } from "@mercurjs/types"

import { ProductCategoryWorkflowEvents } from "../events"
import { createProductCategoriesStep } from "../steps/create-product-categories"

export const createProductCategoriesWorkflowId = "create-product-categories"

type CreateProductCategoriesWorkflowInput = {
  categories: CreateProductCategoryDTO[]
}

export const createProductCategoriesWorkflow = createWorkflow(
  createProductCategoriesWorkflowId,
  function (input: CreateProductCategoriesWorkflowInput) {
    const categories = createProductCategoriesStep(input.categories)

    emitEventStep({
      eventName: ProductCategoryWorkflowEvents.CREATED,
      data: transform({ categories }, ({ categories }) =>
        categories.map((c) => ({ id: c.id }))
      ),
    })

    return new WorkflowResponse(categories)
  }
)

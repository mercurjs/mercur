import {
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { deleteProductCategoriesWorkflow } from "@medusajs/medusa/core-flows"

import { setCategoryImagesWorkflow } from "./set-category-images"

export type DeleteProductCategoryWithImagesWorkflowInput = {
  id: string
}

export const deleteProductCategoryWithImagesWorkflowId =
  "mercur-delete-product-category-with-images"

export const deleteProductCategoryWithImagesWorkflow = createWorkflow(
  deleteProductCategoryWithImagesWorkflowId,
  (input: DeleteProductCategoryWithImagesWorkflowInput) => {
    const cleared = setCategoryImagesWorkflow.runAsStep({
      input: {
        category_id: input.id,
        media: [],
        icon: null,
      },
    })

    const ids = transform({ input, cleared }, ({ input }) => [input.id])

    deleteProductCategoriesWorkflow.runAsStep({
      input: ids as any,
    })
  }
)

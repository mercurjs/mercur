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

/**
 * Removes a category's linked images, then deletes the category. The delete
 * is sequenced after image cleanup (via a data dependency) so no links dangle.
 */
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

    // Depend on `cleared` so image removal completes before the category is gone.
    const ids = transform({ input, cleared }, ({ input }) => [input.id])

    deleteProductCategoriesWorkflow.runAsStep({
      input: ids as any,
    })
  }
)

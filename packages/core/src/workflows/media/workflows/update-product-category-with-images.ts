import { createWorkflow } from "@medusajs/framework/workflows-sdk"
import { updateProductCategoriesWorkflow } from "@medusajs/medusa/core-flows"

import type { CategoryMediaInput } from "../steps/set-category-images"
import { setCategoryImagesStep } from "../steps/set-category-images"

export type UpdateProductCategoryWithImagesWorkflowInput = {
  id: string
  /** Core update payload (name, handle, is_active, …). */
  update: Record<string, unknown>
  /** Gallery images to replace (optional). */
  media?: CategoryMediaInput[]
  /** Icon image URL to set, or null to clear (optional). */
  icon?: string | null
}

export const updateProductCategoryWithImagesWorkflowId =
  "mercur-update-product-category-with-images"

/**
 * Wraps Medusa's `updateProductCategoriesWorkflow` and applies the category's
 * media gallery + icon changes in a single workflow.
 */
export const updateProductCategoryWithImagesWorkflow = createWorkflow(
  updateProductCategoryWithImagesWorkflowId,
  (input: UpdateProductCategoryWithImagesWorkflowInput) => {
    updateProductCategoriesWorkflow.runAsStep({
      input: {
        selector: { id: input.id },
        update: input.update,
      } as any,
    })

    setCategoryImagesStep({
      category_id: input.id,
      media: input.media,
      icon: input.icon,
    })
  }
)

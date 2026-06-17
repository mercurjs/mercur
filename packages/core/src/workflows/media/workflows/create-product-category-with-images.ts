import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { createProductCategoriesWorkflow } from "@medusajs/medusa/core-flows"

import type { CategoryMediaInput } from "./set-category-images"
import { setCategoryImagesWorkflow } from "./set-category-images"

export type CreateProductCategoryWithImagesWorkflowInput = {
  /** Core create payload (name, handle, is_active, parent_category_id, …). */
  product_category: Record<string, unknown>
  /** Gallery images to set (optional). */
  media?: CategoryMediaInput[]
  /** Icon image URL to set, or null (optional). */
  icon?: string | null
}

export const createProductCategoryWithImagesWorkflowId =
  "mercur-create-product-category-with-images"

/**
 * Wraps Medusa's `createProductCategoriesWorkflow` and attaches the category's
 * media gallery + icon in a single workflow, so the route is one call.
 * Returns the created category id.
 */
export const createProductCategoryWithImagesWorkflow = createWorkflow(
  createProductCategoryWithImagesWorkflowId,
  (input: CreateProductCategoryWithImagesWorkflowInput) => {
    const created = createProductCategoriesWorkflow.runAsStep({
      input: {
        product_categories: [input.product_category],
      } as any,
    })

    const categoryId = transform({ created }, ({ created }) => created[0].id)

    const imagesInput = transform(
      { categoryId, input },
      ({ categoryId, input }) => ({
        category_id: categoryId,
        media: input.media,
        icon: input.icon,
      })
    )
    setCategoryImagesWorkflow.runAsStep({ input: imagesInput })

    return new WorkflowResponse(categoryId)
  }
)

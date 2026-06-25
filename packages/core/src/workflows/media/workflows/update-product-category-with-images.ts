import {
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { updateProductCategoriesWorkflow } from "@medusajs/medusa/core-flows"

import type { CategoryMediaInput } from "./set-category-images"
import { setCategoryImagesWorkflow } from "./set-category-images"

export type UpdateProductCategoryWithImagesWorkflowInput = {
  id: string
  update: Record<string, unknown>
  media?: CategoryMediaInput[]
  icon?: string | null
}

export const updateProductCategoryWithImagesWorkflowId =
  "mercur-update-product-category-with-images"

export const updateProductCategoryWithImagesWorkflow = createWorkflow(
  updateProductCategoryWithImagesWorkflowId,
  (input: UpdateProductCategoryWithImagesWorkflowInput) => {
    updateProductCategoriesWorkflow.runAsStep({
      input: {
        selector: { id: input.id },
        update: input.update,
      } as any,
    })

    const imagesInput = transform({ input }, ({ input }) => ({
      category_id: input.id,
      media: input.media,
      icon: input.icon,
    }))
    setCategoryImagesWorkflow.runAsStep({ input: imagesInput })
  }
)

import {
  createWorkflow,
  WorkflowData,
} from "@medusajs/framework/workflows-sdk"

import {
  setCategoryImagesStep,
  SetCategoryImagesStepInput,
} from "../steps/set-category-images"

export type SetCategoryImagesWorkflowInput = SetCategoryImagesStepInput

export const setCategoryImagesWorkflowId = "mercur-set-category-images"

/**
 * Replace a product category's media gallery and/or icon images.
 *
 * - `media` present  → the gallery (type = null) is replaced wholesale.
 * - `icon` present   → the icon (type = "icon") is replaced; `null` clears it.
 *
 * Passing `{ media: [], icon: null }` removes every image — used when a
 * category is deleted.
 */
export const setCategoryImagesWorkflow = createWorkflow(
  setCategoryImagesWorkflowId,
  (
    input: WorkflowData<SetCategoryImagesWorkflowInput>
  ): WorkflowData<void> => {
    setCategoryImagesStep(input)
  }
)

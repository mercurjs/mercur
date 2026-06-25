import {
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { updateCollectionsWorkflow } from "@medusajs/medusa/core-flows"

import type { CollectionMediaInput } from "./set-collection-images"
import { setCollectionImagesWorkflow } from "./set-collection-images"

export type UpdateProductCollectionWithImagesWorkflowInput = {
  id: string
  update: Record<string, unknown>
  media?: CollectionMediaInput[]
  icon?: string | null
}

export const updateProductCollectionWithImagesWorkflowId =
  "mercur-update-product-collection-with-images"

export const updateProductCollectionWithImagesWorkflow = createWorkflow(
  updateProductCollectionWithImagesWorkflowId,
  (input: UpdateProductCollectionWithImagesWorkflowInput) => {
    updateCollectionsWorkflow.runAsStep({
      input: {
        selector: { id: input.id },
        update: input.update,
      } as any,
    })

    const imagesInput = transform({ input }, ({ input }) => ({
      collection_id: input.id,
      media: input.media,
      icon: input.icon,
    }))
    setCollectionImagesWorkflow.runAsStep({ input: imagesInput })
  }
)

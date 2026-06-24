import {
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { deleteCollectionsWorkflow } from "@medusajs/medusa/core-flows"

import { setCollectionImagesWorkflow } from "./set-collection-images"

export type DeleteProductCollectionWithImagesWorkflowInput = {
  id: string
}

export const deleteProductCollectionWithImagesWorkflowId =
  "mercur-delete-product-collection-with-images"

export const deleteProductCollectionWithImagesWorkflow = createWorkflow(
  deleteProductCollectionWithImagesWorkflowId,
  (input: DeleteProductCollectionWithImagesWorkflowInput) => {
    const cleared = setCollectionImagesWorkflow.runAsStep({
      input: {
        collection_id: input.id,
        media: [],
        icon: null,
      },
    })

    const deleteInput = transform({ input, cleared }, ({ input }) => ({
      ids: [input.id],
    }))

    deleteCollectionsWorkflow.runAsStep({ input: deleteInput as any })
  }
)

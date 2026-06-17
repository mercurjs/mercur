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

/**
 * Removes a collection's linked images, then deletes the collection. The
 * delete is sequenced after image cleanup (via a data dependency) so no links
 * dangle.
 */
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

    // Depend on `cleared` so image removal completes before the collection is gone.
    const deleteInput = transform({ input, cleared }, ({ input }) => ({
      ids: [input.id],
    }))

    deleteCollectionsWorkflow.runAsStep({ input: deleteInput as any })
  }
)

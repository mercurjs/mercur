import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { createCollectionsWorkflow } from "@medusajs/medusa/core-flows"

import type { CollectionMediaInput } from "./set-collection-images"
import { setCollectionImagesWorkflow } from "./set-collection-images"

export type CreateProductCollectionWithImagesWorkflowInput = {
  /** Core create payload (title, handle, metadata, …). */
  collection: Record<string, unknown>
  /** Gallery images to set (optional). */
  media?: CollectionMediaInput[]
  /** Icon image URL to set, or null (optional). */
  icon?: string | null
}

export const createProductCollectionWithImagesWorkflowId =
  "mercur-create-product-collection-with-images"

/**
 * Wraps Medusa's `createCollectionsWorkflow` and attaches the collection's
 * media gallery + icon in a single workflow, so the route is one call.
 * Returns the created collection id.
 */
export const createProductCollectionWithImagesWorkflow = createWorkflow(
  createProductCollectionWithImagesWorkflowId,
  (input: CreateProductCollectionWithImagesWorkflowInput) => {
    const created = createCollectionsWorkflow.runAsStep({
      input: {
        collections: [input.collection],
      } as any,
    })

    const collectionId = transform({ created }, ({ created }) => created[0].id)

    const imagesInput = transform(
      { collectionId, input },
      ({ collectionId, input }) => ({
        collection_id: collectionId,
        media: input.media,
        icon: input.icon,
      })
    )
    setCollectionImagesWorkflow.runAsStep({ input: imagesInput })

    return new WorkflowResponse(collectionId)
  }
)

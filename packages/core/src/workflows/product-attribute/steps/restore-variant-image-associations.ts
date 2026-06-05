import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import {
  batchVariantImagesWorkflow,
  updateProductVariantsWorkflow,
} from "@medusajs/medusa/core-flows"
import type { WorkflowResult } from "@medusajs/framework/workflows-sdk"
import type { BatchVariantImagesWorkflowOutput } from "@medusajs/medusa/core-flows"
import type {
  ProductImageDTO,
  ProductVariantDTO,
} from "@medusajs/framework/types"

export type VariantImageAssociation = {
  variantId: string
  imageUrls: string[]
  thumbnailUrl: string | null
}

export type RestoreVariantImageAssociationsInput = {
  productId: string
  associations: VariantImageAssociation[]
}

export const restoreVariantImageAssociationsStep = createStep(
  "restore-variant-image-associations",
  async (
    input: RestoreVariantImageAssociationsInput,
    { container }
  ): Promise<StepResponse<void>> => {
    if (!input.associations || input.associations.length === 0) {
      return new StepResponse(void 0)
    }

    const query = container.resolve(ContainerRegistrationKeys.QUERY) as any

    const {
      data: [product],
    } = await query.graph(
      {
        entity: "product",
        fields: ["id", "images.id", "images.url", "variants.id"],
        filters: { id: input.productId },
      },
      { throwIfKeyNotFound: true }
    )

    const urlToNewImageId = new Map(
      ((product.images || []) as ProductImageDTO[]).map((img) => [
        img.url,
        img.id,
      ])
    )

    const restoreTasks: Array<
      | Promise<WorkflowResult<BatchVariantImagesWorkflowOutput>>
      | Promise<WorkflowResult<ProductVariantDTO[]>>
    > = []

    for (const association of input.associations) {
      const { variantId, imageUrls, thumbnailUrl } = association

      const newImageIds = imageUrls
        .map((url) => urlToNewImageId.get(url))
        .filter((id): id is string => !!id)

      if (newImageIds.length > 0) {
        restoreTasks.push(
          batchVariantImagesWorkflow(container).run({
            input: {
              variant_id: variantId,
              add: newImageIds,
            },
          })
        )
      }

      if (thumbnailUrl && urlToNewImageId.has(thumbnailUrl)) {
        restoreTasks.push(
          updateProductVariantsWorkflow(container).run({
            input: {
              selector: { id: variantId },
              update: { thumbnail: thumbnailUrl },
            },
          })
        )
      }
    }

    if (restoreTasks.length > 0) {
      await Promise.all(restoreTasks)
    }

    return new StepResponse(void 0)
  }
)

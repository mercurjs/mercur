import type {
  ProductImageDTO,
  ProductVariantDTO,
} from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { VariantImageAssociation } from "./restore-variant-image-associations"

export type SaveVariantImageAssociationsInput = {
  productId: string
}

export type SaveVariantImageAssociationsOutput = {
  associations: VariantImageAssociation[]
}

export const saveVariantImageAssociationsStep = createStep(
  "save-variant-image-associations",
  async (
    input: SaveVariantImageAssociationsInput,
    { container }
  ): Promise<StepResponse<SaveVariantImageAssociationsOutput>> => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY) as any

    const {
      data: [product],
    } = await query.graph(
      {
        entity: "product",
        fields: [
          "id",
          "variants.*",
          "variants.images.*",
          "variants.thumbnail",
        ],
        filters: { id: input.productId },
      },
      { throwIfKeyNotFound: true }
    )

    const associations: VariantImageAssociation[] = []

    for (const variant of (product.variants || []) as ProductVariantDTO[]) {
      const imageUrls = ((variant.images || []) as ProductImageDTO[]).map(
        (img) => img.url
      )
      associations.push({
        variantId: variant.id,
        imageUrls,
        thumbnailUrl: variant.thumbnail || null,
      })
    }

    return new StepResponse({ associations })
  }
)

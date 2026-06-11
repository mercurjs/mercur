import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

export type VariantImageUpdate = {
  product_id: string
  variant_id: string
  /**
   * The variant's desired image set. Existing product images carry an
   * `id`; freshly-uploaded ones carry only a `url` and are created as
   * product images before being linked.
   */
  images: Array<{ id?: string; url: string }>
}

type ReconcileVariantImagesStepInput = {
  updates: VariantImageUpdate[]
}

/**
 * Minimal surface of the concrete `ProductModuleService` we rely on for
 * variant media. The variant↔image methods (`addImageToVariant` /
 * `removeImageFromVariant`) live on the implementation, not the public
 * `IProductModuleService` interface, so we resolve against this narrow
 * shape instead of `any`.
 */
interface VariantImageCapableProductService {
  updateProducts(
    id: string,
    data: { images: Array<{ id?: string; url: string }> },
  ): Promise<unknown>
  addImageToVariant(
    data: Array<{ variant_id: string; image_id: string }>,
  ): Promise<unknown>
  removeImageFromVariant(
    data: Array<{ variant_id: string; image_id: string }>,
  ): Promise<unknown>
}

type ImageWithVariants = {
  id: string
  url: string
  variants?: Array<{ id: string }> | null
}

export const reconcileVariantImagesStepId = "pc-reconcile-variant-images"

/**
 * Applies variant-scoped media for confirmed `VARIANT_UPDATE` actions.
 *
 * Variant images in Medusa are product images that are additionally
 * linked to a variant through the `product_variant_product_image`
 * junction. Crucially, `variant.images` also surfaces *general* images
 * (product images linked to no variant), so the variant's *own* set
 * must be read from the junction (`image.variants`), not from
 * `variant.images`. For each variant we:
 *   1. Ensure every referenced URL exists as a product image (new
 *      uploads are appended to the product's image pool to obtain IDs).
 *   2. Reconcile the variant's junction links against the desired set —
 *      linking newly-added images and unlinking removed ones.
 *
 * Reads go through the query graph; writes go through the product module
 * service. Product-level images are never deleted here — unlinking only
 * drops the junction row, leaving the image on the product (matching
 * Medusa's native variant-media behaviour).
 */
export const reconcileVariantImagesStep = createStep(
  reconcileVariantImagesStepId,
  async ({ updates }: ReconcileVariantImagesStepInput, { container }) => {
    if (!updates.length) {
      return new StepResponse(void 0)
    }

    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const productService = container.resolve(
      Modules.PRODUCT,
    ) as unknown as VariantImageCapableProductService

    // Reconcile each product's image pool once, even when several of
    // its variants changed media in the same product change.
    const byProduct = new Map<string, VariantImageUpdate[]>()
    for (const update of updates) {
      const group = byProduct.get(update.product_id) ?? []
      group.push(update)
      byProduct.set(update.product_id, group)
    }

    const loadProductImages = async (
      productId: string,
    ): Promise<ImageWithVariants[]> => {
      const { data } = await query.graph({
        entity: "product",
        fields: ["id", "images.id", "images.url", "images.variants.id"],
        filters: { id: productId },
      })
      return ((data[0]?.images ?? []) as ImageWithVariants[]).filter(
        (image): image is ImageWithVariants => !!image?.id && !!image?.url,
      )
    }

    for (const [productId, group] of byProduct) {
      let productImages = await loadProductImages(productId)
      const urlToId = new Map<string, string>(
        productImages.map((image) => [image.url, image.id]),
      )

      const referencedUrls = new Set<string>()
      for (const update of group) {
        for (const image of update.images) {
          referencedUrls.add(image.url)
        }
      }

      const newUrls = [...referencedUrls].filter((url) => !urlToId.has(url))

      if (newUrls.length) {
        const mergedImages = [
          ...productImages.map((image) => ({ id: image.id, url: image.url })),
          ...newUrls.map((url) => ({ url })),
        ]
        await productService.updateProducts(productId, { images: mergedImages })

        productImages = await loadProductImages(productId)
        for (const image of productImages) {
          urlToId.set(image.url, image.id)
        }
      }

      // Junction-derived current links per variant: which images are
      // actually associated with each variant (general images excluded).
      const linkedVariantsByImageId = new Map<string, Set<string>>()
      for (const image of productImages) {
        linkedVariantsByImageId.set(
          image.id,
          new Set((image.variants ?? []).map((variant) => variant.id)),
        )
      }

      for (const update of group) {
        const currentIds = new Set<string>()
        for (const [imageId, variantIds] of linkedVariantsByImageId) {
          if (variantIds.has(update.variant_id)) {
            currentIds.add(imageId)
          }
        }

        const desiredIds = new Set<string>()
        for (const image of update.images) {
          const id = urlToId.get(image.url)
          if (id) {
            desiredIds.add(id)
          }
        }

        const toAdd = [...desiredIds]
          .filter((id) => !currentIds.has(id))
          .map((image_id) => ({ variant_id: update.variant_id, image_id }))
        const toRemove = [...currentIds]
          .filter((id) => !desiredIds.has(id))
          .map((image_id) => ({ variant_id: update.variant_id, image_id }))

        if (toAdd.length) {
          await productService.addImageToVariant(toAdd)
        }
        if (toRemove.length) {
          await productService.removeImageFromVariant(toRemove)
        }
      }
    }

    return new StepResponse(void 0)
  },
)

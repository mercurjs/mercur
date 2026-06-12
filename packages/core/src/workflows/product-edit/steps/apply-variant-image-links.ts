import { Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

export type VariantImageLinks = {
  variant_id: string
  /** Product image ids to link to the variant. */
  add: string[]
  /** Product image ids to unlink from the variant. */
  remove: string[]
}

type ApplyVariantImageLinksStepInput = {
  updates: VariantImageLinks[]
}

/**
 * Minimal surface of the concrete `ProductModuleService` we rely on for
 * variant media. The variant↔image methods (`addImageToVariant` /
 * `removeImageFromVariant`) live on the implementation, not the public
 * `IProductModuleService` interface, so we resolve against this narrow
 * shape instead of `any`.
 */
interface VariantImageCapableProductService {
  addImageToVariant(
    data: Array<{ variant_id: string; image_id: string }>,
  ): Promise<unknown>
  removeImageFromVariant(
    data: Array<{ variant_id: string; image_id: string }>,
  ): Promise<unknown>
}

export const applyVariantImageLinksStepId = "pc-apply-variant-image-links"

/**
 * Applies variant-scoped media for confirmed `VARIANT_UPDATE` actions.
 *
 * Variant images in Medusa are product images additionally linked to a
 * variant through the `product_variant_product_image` junction. The
 * vendor selects from images already on the product, so we only ever
 * link/unlink existing ids — no image creation and no desired-set
 * reconciliation. The add/remove diff is computed client-side (mirroring
 * Medusa's batch endpoint); here we just apply it. Unlinking drops the
 * junction row only, leaving the image on the product.
 */
export const applyVariantImageLinksStep = createStep(
  applyVariantImageLinksStepId,
  async ({ updates }: ApplyVariantImageLinksStepInput, { container }) => {
    if (!updates.length) {
      return new StepResponse(void 0)
    }

    const productService = container.resolve(
      Modules.PRODUCT,
    ) as unknown as VariantImageCapableProductService

    const toAdd: Array<{ variant_id: string; image_id: string }> = []
    const toRemove: Array<{ variant_id: string; image_id: string }> = []

    for (const update of updates) {
      for (const image_id of update.add) {
        toAdd.push({ variant_id: update.variant_id, image_id })
      }
      for (const image_id of update.remove) {
        toRemove.push({ variant_id: update.variant_id, image_id })
      }
    }

    if (toAdd.length) {
      await productService.addImageToVariant(toAdd)
    }
    if (toRemove.length) {
      await productService.removeImageFromVariant(toRemove)
    }

    return new StepResponse(void 0)
  },
)

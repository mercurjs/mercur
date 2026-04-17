import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"
import { ProductVariantDTO, UpdateProductVariantDTO, UpsertProductVariantDTO } from "@mercurjs/types"
import ProductModuleService from "../../../modules/product/service"

export type UpdateProductVariantsStepInput =
  | {
    selector: Record<string, unknown>
    update: UpdateProductVariantDTO
  }
  | {
    product_variants: (UpdateProductVariantDTO & { id: string })[]
  }

export const updateProductVariantsStep = createStep(
  "update-product-variants",
  async (input: UpdateProductVariantsStepInput, { container }) => {
    const service = container.resolve<ProductModuleService>(Modules.PRODUCT)

    if ("product_variants" in input) {
      if (!input.product_variants.length) {
        return new StepResponse([], [])
      }

      const prevData = await service.listProductVariants({
        id: input.product_variants.map((v) => v.id),
      })

      const variants = await service.updateProductVariants(
        input.product_variants
      )
      return new StepResponse(
        variants,
        prevData
      )
    }

    const prevData = await service.listProductVariants(input.selector)
    const variants = await service.updateProductVariants(
      input.selector, input.update
    )

    return new StepResponse(
      variants,
      prevData
    )
  },
  async (prevData, { container }) => {
    if (!prevData?.length) {
      return
    }

    const service = container.resolve<ProductModuleService>(Modules.PRODUCT)
    await service.upsertProductVariants(
      prevData as unknown as UpsertProductVariantDTO[]
    )
  }
)

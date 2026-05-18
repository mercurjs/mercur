import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"
import { CreateProductVariantDTO, ProductVariantDTO } from "@mercurjs/types"
import ProductModuleService from "../../../modules/product/service"

export const createProductVariantsStep = createStep(
  "create-product-variants",
  async (data: CreateProductVariantDTO[], { container }) => {
    const service = container.resolve<ProductModuleService>(Modules.PRODUCT)
    const result = await service.createProductVariants(data)
    const variants = (
      Array.isArray(result) ? result : [result]
    ) as ProductVariantDTO[]
    return new StepResponse(
      variants,
      variants.map((v) => v.id)
    )
  },
  async (ids, { container }) => {
    if (!ids?.length) {
      return
    }

    const service = container.resolve<ProductModuleService>(Modules.PRODUCT)
    await service.deleteProductVariants(ids)
  }
)

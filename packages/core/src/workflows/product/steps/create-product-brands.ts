import { Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { CreateProductBrandDTO } from "@mercurjs/types"

import ProductModuleService from "../../../modules/product/service"

export const createProductBrandsStep = createStep(
  "create-product-brands",
  async (data: CreateProductBrandDTO[], { container }) => {
    const service = container.resolve<ProductModuleService>(Modules.PRODUCT)
    const brands = await service.createProductBrands(data)
    return new StepResponse(
      brands,
      brands.map((b) => b.id)
    )
  },
  async (ids: string[], { container }) => {
    if (!ids?.length) {
      return
    }

    const service = container.resolve<ProductModuleService>(Modules.PRODUCT)
    await service.deleteProductBrands(ids)
  }
)

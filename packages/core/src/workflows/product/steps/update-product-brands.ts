import { Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import {
  UpdateProductBrandDTO,
} from "@mercurjs/types"

import ProductModuleService from "../../../modules/product/service"

type UpdateProductBrandsStepInput = {
  selector: Record<string, unknown>
  update: UpdateProductBrandDTO
}

export const updateProductBrandsStep = createStep(
  "update-product-brands",
  async (
    { selector, update }: UpdateProductBrandsStepInput,
    { container }
  ) => {
    const service = container.resolve<ProductModuleService>(Modules.PRODUCT)
    const prevBrands = (await service.listProductBrands(
      selector
    ))
    const brands = await service.updateProductBrands([
      {
        selector,
        data: update
      },
    ]
    )
    return new StepResponse(brands, prevBrands)
  },
  async (prevBrands, { container }) => {
    if (!prevBrands?.length) {
      return
    }

    const service = container.resolve<ProductModuleService>(Modules.PRODUCT)
    await service.updateProductBrands(
      prevBrands.map(({ id, name, handle, is_restricted, metadata }) => ({
        id,
        name,
        handle,
        is_restricted,
        metadata,
      }))
    )
  }
)

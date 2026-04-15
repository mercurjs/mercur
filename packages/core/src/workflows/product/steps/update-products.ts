import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"
import { ProductDTO, UpdateProductDTO } from "@mercurjs/types"
import ProductModuleService from "../../../modules/product/service"

type UpdateProductsStepInput = {
  selector: Record<string, unknown>
  data: UpdateProductDTO
}

export const updateProductsStep = createStep(
  "update-products",
  async (
    { selector, data }: UpdateProductsStepInput,
    { container }
  ) => {
    const service = container.resolve<ProductModuleService>(Modules.PRODUCT)
    const prevProducts = await service.listProducts(selector)

    const products = await service.updateProducts(selector, data)

    return new StepResponse(products, prevProducts)
  },
  async (prevProducts, { container }) => {
    if (!prevProducts?.length) {
      return
    }

    const service = container.resolve<ProductModuleService>(Modules.PRODUCT)
    await service.updateProducts(
      prevProducts
    )
  }
)

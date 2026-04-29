import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"
import ProductModuleService from "../../../modules/product/service"

type RetrieveProductWithChangeStepInput = {
  product_id: string
}

export const retrieveProductWithChangeStep = createStep(
  "retrieve-product-with-change",
  async ({ product_id }: RetrieveProductWithChangeStepInput, { container }) => {
    const service = container.resolve<ProductModuleService>(Modules.PRODUCT)

    const product = await service.retrieveProduct(product_id)

    return new StepResponse(product)
  }
)

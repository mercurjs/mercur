import { MedusaError, Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

import ProductModuleService from "../../../modules/product/service"

type ValidateDeleteProductAttributesInput = {
  ids: string[]
}

export const validateDeleteProductAttributesStep = createStep(
  "validate-delete-product-attributes",
  async ({ ids }: ValidateDeleteProductAttributesInput, { container }) => {
    const service = container.resolve<ProductModuleService>(Modules.PRODUCT)

    const attributes = await service.listProductAttributes(
      { id: ids },
      { relations: ["variant_products"] }
    )

    for (const attr of attributes as any[]) {
      if (attr.variant_products?.length) {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          `Cannot delete attribute '${attr.name}' because it is used by ${attr.variant_products.length} product(s). Remove the attribute from all products first.`
        )
      }
    }

    return new StepResponse(void 0)
  }
)

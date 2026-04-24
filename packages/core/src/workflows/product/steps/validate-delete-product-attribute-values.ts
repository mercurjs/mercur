import { MedusaError, Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

import ProductModuleService from "../../../modules/product/service"

type ValidateDeleteProductAttributeValuesInput = {
  ids: string[]
}

export const validateDeleteProductAttributeValuesStep = createStep(
  "validate-delete-product-attribute-values",
  async (
    { ids }: ValidateDeleteProductAttributeValuesInput,
    { container }
  ) => {
    const service = container.resolve<ProductModuleService>(Modules.PRODUCT)

    const values = await service.listProductAttributeValues(
      { id: ids },
      { relations: ["variants", "products"] }
    )

    for (const val of values as any[]) {
      const variantCount = val.variants?.length ?? 0
      const productCount = val.products?.length ?? 0
      const total = variantCount + productCount

      if (total > 0) {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          `Cannot delete attribute value '${val.name}' because it is used by ${total} product(s) or variant(s). Remove the value from all products first.`
        )
      }
    }

    return new StepResponse(void 0)
  }
)

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
      { relations: ["variant_products", "values", "values.products"] }
    )

    for (const attr of attributes as any[]) {
      if (attr.is_required) {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          `Cannot delete attribute '${attr.name}' because it is marked as required.`
        )
      }

      // Check variant axis M2M
      if (attr.variant_products?.length) {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          `Cannot delete attribute '${attr.name}' because it is used as a variant axis by ${attr.variant_products.length} product(s). Remove the attribute from all products first.`
        )
      }

      // Check product attribute_values M2M (via values)
      const linkedProducts = new Set<string>()
      for (const value of attr.values ?? []) {
        for (const product of value.products ?? []) {
          linkedProducts.add(product.id)
        }
      }

      if (linkedProducts.size) {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          `Cannot delete attribute '${attr.name}' because its values are linked to ${linkedProducts.size} product(s). Remove the attribute from all products first.`
        )
      }
    }

    return new StepResponse(void 0)
  }
)

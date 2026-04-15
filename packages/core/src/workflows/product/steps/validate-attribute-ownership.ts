import { MedusaError, Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

import ProductModuleService from "../../../modules/product/service"

type ValidateAttributeOwnershipInput = {
  attribute_id: string
  seller_id: string
}

export const validateAttributeOwnershipStep = createStep(
  "validate-attribute-ownership",
  async (
    { attribute_id, seller_id }: ValidateAttributeOwnershipInput,
    { container }
  ) => {
    const service = container.resolve<ProductModuleService>(Modules.PRODUCT)
    const attribute = await service.retrieveProductAttribute(attribute_id)

    if (!attribute.created_by || attribute.created_by !== seller_id) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `Seller is not allowed to modify attribute '${attribute_id}'`
      )
    }

    return new StepResponse(void 0)
  }
)

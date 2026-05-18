import { MedusaError, Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { AttributeType } from "@mercurjs/types"

import ProductModuleService from "../../../modules/product/service"

const VALUE_ACCEPTING_TYPES = new Set<AttributeType>([
  AttributeType.SINGLE_SELECT,
  AttributeType.MULTI_SELECT,
])

type ValidateAttributeAcceptsValuesInput = {
  attribute_id: string
}

export const validateAttributeAcceptsValuesStep = createStep(
  "validate-attribute-accepts-values",
  async (
    { attribute_id }: ValidateAttributeAcceptsValuesInput,
    { container }
  ) => {
    const service = container.resolve<ProductModuleService>(Modules.PRODUCT)
    const attribute = await service.retrieveProductAttribute(attribute_id)

    if (!VALUE_ACCEPTING_TYPES.has(attribute.type as AttributeType)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Attribute '${attribute.name}' (type=${attribute.type}) does not accept enumerated values. Only single_select and multi_select attributes may define values.`
      )
    }

    return new StepResponse(void 0)
  }
)

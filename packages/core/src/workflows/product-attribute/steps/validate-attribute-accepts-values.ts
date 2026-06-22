import { MedusaError } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import {
  AttributeType,
  MercurModules,
  ProductAttributeDTO,
} from "@mercurjs/types"

import type ProductAttributeModuleService from "../../../modules/product-attribute/service"

export const validateAttributeAcceptsValuesStepId =
  "pa-validate-attribute-accepts-values"

const VALUE_ACCEPTING_TYPES = new Set<AttributeType>([
  AttributeType.SINGLE_SELECT,
  AttributeType.MULTI_SELECT,
])

type ValidateAttributeAcceptsValuesStepInput = {
  attribute_id: string
}

export const validateAttributeAcceptsValuesStep = createStep(
  validateAttributeAcceptsValuesStepId,
  async (
    { attribute_id }: ValidateAttributeAcceptsValuesStepInput,
    { container },
  ) => {
    const service = container.resolve<ProductAttributeModuleService>(
      MercurModules.PRODUCT_ATTRIBUTE,
    )
    const attribute = (await service.retrieveProductAttribute(
      attribute_id,
    )) as ProductAttributeDTO

    if (!VALUE_ACCEPTING_TYPES.has(attribute.type as AttributeType)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Attribute '${attribute.name}' (type=${attribute.type}) does not accept enumerated values. Only single_select and multi_select attributes may define values.`,
      )
    }

    return new StepResponse(void 0)
  },
)

import { MedusaError } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { AttributeType, CreateProductAttributeDTO } from "@mercurjs/types"

export const validateProductAttributeInputStepId =
  "pa-validate-product-attribute-input"

type ValidateProductAttributeInputStepInput = {
  attributes: CreateProductAttributeDTO[]
}

const ALLOWED_TYPES = new Set<AttributeType>(Object.values(AttributeType))

export const validateProductAttributeInputStep = createStep(
  validateProductAttributeInputStepId,
  async ({ attributes }: ValidateProductAttributeInputStepInput) => {
    for (const attr of attributes) {
      if (!attr.name || !attr.name.trim()) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Product attribute requires a non-empty 'name'",
        )
      }
      if (!ALLOWED_TYPES.has(attr.type)) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Unsupported product attribute type '${attr.type}'`,
        )
      }
    }
    return new StepResponse(void 0)
  },
)

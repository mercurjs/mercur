import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"

export type ValidateProductAttributesNotRequiredInput = {
  id: string
  name: string
  is_required: boolean
}[]

export const validateProductAttributesNotRequiredStepId =
  "pa-validate-attributes-not-required"

export const validateProductAttributesNotRequiredStep = createStep(
  validateProductAttributesNotRequiredStepId,
  async (attributes: ValidateProductAttributesNotRequiredInput) => {
    const required = (attributes ?? []).filter((a) => a.is_required)

    if (required.length > 0) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `Cannot remove required attribute(s) ${required
          .map((a) => a.name)
          .join(", ")}: required attributes must stay attached to the product.`,
      )
    }

    return new StepResponse(void 0)
  },
)

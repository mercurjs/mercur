import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"

export type ValidateProductAttributesNotInternalInput = {
  id: string
  name: string
  is_internal: boolean
}[]

export const validateProductAttributesNotInternalStepId =
  "pa-validate-attributes-not-internal"

export const validateProductAttributesNotInternalStep = createStep(
  validateProductAttributesNotInternalStepId,
  async (attributes: ValidateProductAttributesNotInternalInput) => {
    const internal = (attributes ?? []).filter((a) => a.is_internal)

    if (internal.length > 0) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `Attribute(s) ${internal
          .map((a) => a.name)
          .join(", ")} are internal and cannot be modified by sellers.`,
      )
    }

    return new StepResponse(void 0)
  },
)

import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"
import { AttributeScope } from "@mercurjs/types"

export type ValidateProductAttributesScopeInput = {
  expected: AttributeScope
  requested_ids: string[]
  attributes: { id: string; name: string; scope: AttributeScope }[]
}

export const validateProductAttributesScopeStepId =
  "pa-validate-attributes-scope"

export const validateProductAttributesScopeStep = createStep(
  validateProductAttributesScopeStepId,
  async (input: ValidateProductAttributesScopeInput) => {
    const found = new Set(input.attributes.map((a) => a.id))
    const missing = input.requested_ids.filter((id) => !found.has(id))
    if (missing.length > 0) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Product attribute(s) ${missing.join(", ")} not found.`,
      )
    }

    const wrongScope = input.attributes.filter(
      (a) => (a.scope ?? AttributeScope.PRODUCT) !== input.expected,
    )
    if (wrongScope.length > 0) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Attribute(s) ${wrongScope
          .map((a) => a.name)
          .join(", ")} are not ${input.expected}-level attributes.`,
      )
    }

    return new StepResponse(void 0)
  },
)

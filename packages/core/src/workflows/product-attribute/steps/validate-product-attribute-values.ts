import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"
import { AttributeType, ProductAttributeValidation } from "@mercurjs/types"

export type ValidateProductAttributeValuesInput = {
  name: string
  type: AttributeType
  validation?: ProductAttributeValidation | null
  value: string | number | boolean
}[]

export const SCALAR_VALUE_TYPES: AttributeType[] = [
  AttributeType.TEXT,
  AttributeType.UNIT,
  AttributeType.DATE,
]

const PATTERN_TYPES: AttributeType[] = [AttributeType.TEXT, AttributeType.UNIT]

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/

export const isIsoDate = (value: string) => {
  const match = ISO_DATE.exec(value)
  if (!match) {
    return false
  }
  const [, y, m, d] = match.map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d
  )
}

const errorFor = ({
  name,
  type,
  validation,
  value,
}: ValidateProductAttributeValuesInput[number]): string | null => {
  const raw = String(value)

  if (type === AttributeType.DATE && !isIsoDate(raw)) {
    return `${name}: "${raw}" is not a valid date (expected YYYY-MM-DD)`
  }

  const pattern = validation?.pattern
  if (pattern && PATTERN_TYPES.includes(type)) {
    // Anchored so a pattern written without ^/$ still has to match the whole value.
    if (!new RegExp(`^(?:${pattern})$`).test(raw)) {
      return validation?.message
        ? `${name}: ${validation.message}`
        : `${name}: "${raw}" does not match the pattern ${pattern}`
    }
  }

  return null
}

export const validateProductAttributeValuesStepId =
  "pa-validate-attribute-values"

export const validateProductAttributeValuesStep = createStep(
  validateProductAttributeValuesStepId,
  async (values: ValidateProductAttributeValuesInput) => {
    const errors = (values ?? [])
      .map(errorFor)
      .filter((error): error is string => !!error)

    if (errors.length > 0) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, errors.join("; "))
    }

    return new StepResponse(void 0)
  },
)

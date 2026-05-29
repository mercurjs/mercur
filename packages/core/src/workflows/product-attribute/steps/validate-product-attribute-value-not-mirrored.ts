import { Query } from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

export const validateProductAttributeValueNotMirroredStepId =
  "pa-validate-product-attribute-value-not-mirrored"

/**
 * Soft-blocks attribute-value deletion when the value is mirrored to a stock
 * `ProductOptionValue` via `product_option_value_attribute_value_link`. Reads
 * through the `source_attribute_value` field alias declared on
 * `product-option-value-attribute-value-link.ts`.
 */
type ValidateProductAttributeValueNotMirroredStepInput = {
  ids: string[]
}

export const validateProductAttributeValueNotMirroredStep = createStep(
  validateProductAttributeValueNotMirroredStepId,
  async (
    { ids }: ValidateProductAttributeValueNotMirroredStepInput,
    { container },
  ) => {
    if (!ids.length) {
      return new StepResponse(void 0)
    }

    const query = container.resolve<Query>(ContainerRegistrationKeys.QUERY)

    const { data: optionValues } = await query.graph({
      entity: "product_option_value",
      fields: ["id", "value", "source_attribute_value.id"],
      filters: {},
    })

    const blockingIds = new Set<string>()
    for (const ov of optionValues as Array<{
      id: string
      source_attribute_value?: { id?: string } | null
    }>) {
      const linkedValueId = ov.source_attribute_value?.id
      if (linkedValueId && ids.includes(linkedValueId)) {
        blockingIds.add(linkedValueId)
      }
    }

    if (blockingIds.size) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `Cannot delete attribute value(s) [${[...blockingIds].join(", ")}]: still mirrored to one or more ProductOptionValue rows. Drop the mirror first.`,
      )
    }

    return new StepResponse(void 0)
  },
)

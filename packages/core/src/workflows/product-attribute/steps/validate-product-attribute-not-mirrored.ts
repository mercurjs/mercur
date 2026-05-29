import { Query } from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

export const validateProductAttributeNotMirroredStepId =
  "pa-validate-product-attribute-not-mirrored"

/**
 * Soft-blocks attribute deletion when the attribute is mirrored to a stock
 * `ProductOption` via `product_option_attribute_link`. Reads through the
 * `source_attribute` field alias declared on `product-option-attribute-link.ts`.
 *
 * The mirror link is the **only** dependency that gates attribute deletion —
 * variant-axis usage and per-product attribute-value selection are handled by
 * the `product_variant_attribute` and `product_attribute_value_link` link
 * tables but those rows are dismissed automatically by `dismissRemoteLinkStep`
 * in the parent workflow.
 */
type ValidateProductAttributeNotMirroredStepInput = {
  ids: string[]
}

export const validateProductAttributeNotMirroredStep = createStep(
  validateProductAttributeNotMirroredStepId,
  async (
    { ids }: ValidateProductAttributeNotMirroredStepInput,
    { container },
  ) => {
    if (!ids.length) {
      return new StepResponse(void 0)
    }

    const query = container.resolve<Query>(ContainerRegistrationKeys.QUERY)

    const { data: options } = await query.graph({
      entity: "product_option",
      fields: ["id", "title", "source_attribute.id"],
      filters: {},
    })

    const blockingIds = new Set<string>()
    for (const option of options as Array<{
      id: string
      source_attribute?: { id?: string } | null
    }>) {
      const linkedAttributeId = option.source_attribute?.id
      if (linkedAttributeId && ids.includes(linkedAttributeId)) {
        blockingIds.add(linkedAttributeId)
      }
    }

    if (blockingIds.size) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `Cannot delete attribute(s) [${[...blockingIds].join(", ")}]: still mirrored to one or more ProductOption rows. Drop the mirror first.`,
      )
    }

    return new StepResponse(void 0)
  },
)

import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"

export const validateProductAttributesNotLinkedStepId =
  "pa-validate-attributes-not-linked"

export const validateProductAttributesNotLinkedStep = createStep(
  validateProductAttributesNotLinkedStepId,
  async (ids: string[], { container }) => {
    if (!ids?.length) {
      return new StepResponse(void 0)
    }

    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const { data } = await query.graph({
      entity: "product_attribute_value",
      fields: ["id", "attribute_id", "products.id", "variant_links.id"],
      filters: { attribute_id: ids },
    })

    const linkedAttributeIds = new Set<string>()
    for (const value of (data ?? []) as {
      attribute_id: string | null
      products?: { id: string }[] | null
      variant_links?: { id: string }[] | null
    }[]) {
      const inUse =
        (value.products?.length ?? 0) > 0 ||
        (value.variant_links?.length ?? 0) > 0
      if (value.attribute_id && inUse) {
        linkedAttributeIds.add(value.attribute_id)
      }
    }

    if (linkedAttributeIds.size > 0) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `Cannot delete product attribute(s) ${[...linkedAttributeIds].join(
          ", ",
        )}: they are in use on one or more products or variants.`,
      )
    }

    return new StepResponse(void 0)
  },
)

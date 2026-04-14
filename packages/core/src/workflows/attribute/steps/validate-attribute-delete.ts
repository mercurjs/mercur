import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { createStep } from "@medusajs/framework/workflows-sdk"

export const validateAttributeDeleteStepId = "validate-attribute-delete-step"

type ValidateAttributeDeleteInput = {
  id: string
}

export const validateAttributeDeleteStep = createStep(
  validateAttributeDeleteStepId,
  async ({ id }: ValidateAttributeDeleteInput, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    // Get attribute name for error messages
    const {
      data: [attribute],
    } = await query.graph({
      entity: "attribute",
      filters: { id },
      fields: ["name"],
    })

    const attributeName = attribute?.name ?? id

    // Check attribute_value (same module)
    try {
      const { data: attributeValues } = await query.graph({
        entity: "attribute_value",
        filters: { attribute_id: id },
        fields: ["id"],
      })

      if (attributeValues.length > 0) {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          `Attribute "${attributeName}" can't be deleted because it's currently used by one or more Vendors in their product variants. To delete it, ask the Vendors to update their products first.`
        )
      }
    } catch (err: any) {
      if (err.type === MedusaError.Types.NOT_ALLOWED) {
        throw err
      }
    }

    // Check vendor_product_attribute (separate module, may not exist)
    try {
      const { data: vendorAttributes } = await query.graph({
        entity: "vendor_product_attribute",
        filters: { extends_attribute_id: id },
        fields: ["id"],
      })

      if (vendorAttributes.length > 0) {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          `Attribute "${attributeName}" can't be deleted because it's currently used by one or more Vendors in their product variants. To delete it, ask the Vendors to update their products first.`
        )
      }
    } catch (err: any) {
      if (err.type === MedusaError.Types.NOT_ALLOWED) {
        throw err
      }
      // Table doesn't exist yet — no vendor usage, allow deletion
    }
  }
)

import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { createStep } from "@medusajs/framework/workflows-sdk"

import { UpdateAttributeDTO } from "@mercurjs/types"

export const validatePossibleValuesRemovalStepId =
  "validate-possible-values-removal-step"

type ValidatePossibleValuesRemovalInput = {
  attributes: UpdateAttributeDTO[]
}

export const validatePossibleValuesRemovalStep = createStep(
  validatePossibleValuesRemovalStepId,
  async (
    input: ValidatePossibleValuesRemovalInput,
    { container }
  ) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    for (const attribute of input.attributes) {
      if (attribute.possible_values === undefined) {
        continue
      }

      const newValueIds = new Set(
        attribute.possible_values
          .map((v: any) => v.id)
          .filter(Boolean)
      )

      // Get current possible values
      const { data: currentValues } = await query.graph({
        entity: "attribute_possible_value",
        filters: { attribute_id: attribute.id },
        fields: ["id", "value"],
      })

      const removedValues = currentValues.filter(
        (pv: any) => !newValueIds.has(pv.id)
      )

      if (removedValues.length === 0) {
        continue
      }

      // Check if any attribute_value records exist for this attribute
      // (vendor-assigned values referencing the same attribute)
      const removedValueTexts = removedValues.map((pv: any) => pv.value)

      try {
        const { data: usedValues } = await query.graph({
          entity: "attribute_value",
          filters: {
            attribute_id: attribute.id,
            value: removedValueTexts,
          },
          fields: ["id", "value"],
        })

        if (usedValues.length > 0) {
          throw new MedusaError(
            MedusaError.Types.NOT_ALLOWED,
            `Possible value "${usedValues[0].value}" can't be deleted because it's currently used by one or more Vendors in their product variants. To delete it, ask the Vendors to update their products first.`
          )
        }
      } catch (err: any) {
        // If error is our own NOT_ALLOWED, rethrow
        if (err.type === MedusaError.Types.NOT_ALLOWED) {
          throw err
        }

        // Try vendor_product_attribute as fallback
        try {
          const { data: vendorUsages } = await query.graph({
            entity: "vendor_product_attribute",
            filters: {
              extends_attribute_id: attribute.id,
              value: removedValueTexts,
            },
            fields: ["id", "value"],
          })

          if (vendorUsages.length > 0) {
            throw new MedusaError(
              MedusaError.Types.NOT_ALLOWED,
              `Possible value "${vendorUsages[0].value}" can't be deleted because it's currently used by one or more Vendors in their product variants. To delete it, ask the Vendors to update their products first.`
            )
          }
        } catch (innerErr: any) {
          if (innerErr.type === MedusaError.Types.NOT_ALLOWED) {
            throw innerErr
          }
          // Table doesn't exist yet — no vendor usage, allow deletion
        }
      }
    }
  }
)

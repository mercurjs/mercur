import { MedusaContainer, ProductDTO } from "@medusajs/framework/types"
import { MedusaError, arrayDifference } from "@medusajs/framework/utils"

import {
  AdminAttributeInput,
  AttributeSource,
  AttributeUIComponent,
  VendorAttributeInput,
} from "@mercurjs/types"

import { getApplicableAttributes } from "./get-applicable-attributes"
import { createAttributeValueWorkflow } from "../workflows/create-attribute-value"
import { createAndLinkAttributeValuesWorkflow } from "../workflows/create-and-link-attribute-values"
import { findOrCreateVendorAttribute } from "./find-or-create-vendor-attribute"

type ApplicableAttribute = Awaited<
  ReturnType<typeof getApplicableAttributes>
>[number]

function ensureApplicableAttribute(
  attributeId: string,
  attributesById: Map<string, ApplicableAttribute>,
  productTitle: string
): ApplicableAttribute {
  const attributeDef = attributesById.get(attributeId)
  if (!attributeDef) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Attribute ${attributeId} is not applicable to product "${productTitle}"`
    )
  }
  return attributeDef
}

function validateVariationAttributeHasOption(
  attributeName: string,
  product: ProductDTO,
  useForVariations: boolean
): void {
  if (!useForVariations) {
    return
  }

  const optionTitles = (product.options ?? []).map((opt) =>
    opt.title.toLowerCase()
  )
  const attributeNameLower = attributeName.toLowerCase()

  if (!optionTitles.includes(attributeNameLower)) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Attribute "${attributeName}" has use_for_variations=true but no corresponding ProductOption with title "${attributeName}" exists on product "${product.title}". ` +
        `When use_for_variations is true, you must also include the attribute in the product options array.`
    )
  }
}

interface ProductsCreatedHookInput {
  products: ProductDTO[]
  additional_data: Record<string, unknown> | undefined
  container: MedusaContainer
}

export const productsCreatedHookHandler = async ({
  products,
  additional_data,
  container,
}: ProductsCreatedHookInput) => {
  const adminAttributeInputs = (additional_data?.admin_attributes ??
    []) as AdminAttributeInput[]
  const vendorAttributeInputs = (additional_data?.vendor_attributes ??
    []) as VendorAttributeInput[]
  const sellerId = additional_data?.seller_id as string | undefined

  if (!adminAttributeInputs.length && !vendorAttributeInputs.length) {
    return []
  }

  for (const product of products) {
    const applicableAttributes = await getApplicableAttributes(
      container,
      product.id,
      ["id", "name", "is_required", "possible_values.value"]
    )

    const requiredAttributes = applicableAttributes.filter(
      (attr: any) => attr.is_required
    )

    const missingAttributes = arrayDifference(
      requiredAttributes.map((attr: any) => attr.id),
      adminAttributeInputs.map((attr) => attr.attribute_id)
    )

    if (missingAttributes.length) {
      const missingNames = requiredAttributes
        .filter((attr: any) => missingAttributes.includes(attr.id))
        .map((attr: any) => attr.name)
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Missing required attributes for product "${product.title}": ${missingNames.join(", ")}`
      )
    }

    const attributesById = new Map(
      applicableAttributes.map((attribute: any) => [
        attribute.id,
        attribute,
      ])
    )

    // Process admin attributes
    for (const adminAttr of adminAttributeInputs) {
      const attributeDef = ensureApplicableAttribute(
        adminAttr.attribute_id,
        attributesById,
        product.title
      )

      validateVariationAttributeHasOption(
        attributeDef.name,
        product,
        adminAttr.use_for_variations
      )

      const allowedValues = new Set(
        attributeDef.possible_values?.map((pv: any) => pv.value) ?? []
      )

      const creationPromises = adminAttr.values.map((value: string) => {
        const isFromPossibleValues =
          allowedValues.size === 0 || allowedValues.has(value)

        return createAttributeValueWorkflow(container).run({
          input: {
            attribute_id: adminAttr.attribute_id,
            value,
            product_id: product.id,
            source: isFromPossibleValues
              ? AttributeSource.ADMIN
              : AttributeSource.VENDOR,
          },
        })
      })

      await Promise.all(creationPromises)
    }

    // Process vendor attributes (only informational, not variations)
    for (const vendorAttr of vendorAttributeInputs) {
      if (vendorAttr.use_for_variations) {
        continue
      }

      if (!sellerId) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "seller_id is required for vendor attributes"
        )
      }

      const attribute = await findOrCreateVendorAttribute(container, {
        sellerId,
        name: vendorAttr.name,
        ui_component:
          (vendorAttr.ui_component as AttributeUIComponent) ??
          AttributeUIComponent.TEXTAREA,
      })

      await createAndLinkAttributeValuesWorkflow(container).run({
        input: {
          product_id: product.id,
          attribute_id: attribute.id,
          seller_id: sellerId,
          values: vendorAttr.values.map((value) => ({
            value,
            source: AttributeSource.VENDOR as AttributeSource,
          })),
        },
      })
    }
  }
}

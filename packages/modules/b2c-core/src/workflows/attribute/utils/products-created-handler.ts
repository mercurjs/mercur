import { MedusaContainer, ProductDTO } from "@medusajs/framework/types";
import { MedusaError, arrayDifference } from "@medusajs/framework/utils";

import { AdminAttributeInput, VendorAttributeInput } from "@mercurjs/framework";

import { getApplicableAttributes } from "../../../shared/infra/http/utils/products";
import { createAttributeValues } from "./attribute-value-creation";
import { createVendorAttributes } from "./vendor-attribute-creation";
import { ensureApplicableAttribute } from "./attribute-validation";

interface ProductsCreatedHookInput {
  products: ProductDTO[];
  additional_data: Record<string, unknown> | undefined;
  container: MedusaContainer;
}

/**
 * Validates that for attributes with use_for_variations=true,
 * a corresponding ProductOption exists on the product.
 */
function validateVariationAttributeHasOption(
  attributeName: string,
  product: ProductDTO,
  useForVariations: boolean
): void {
  if (!useForVariations) {
    return;
  }

  const optionTitles = (product.options ?? []).map((opt) =>
    opt.title.toLowerCase()
  );
  const attributeNameLower = attributeName.toLowerCase();

  if (!optionTitles.includes(attributeNameLower)) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Attribute "${attributeName}" has use_for_variations=true but no corresponding ProductOption with title "${attributeName}" exists on product "${product.title}". ` +
        `When use_for_variations is true, you must also include the attribute in the product options array.`
    );
  }
}

export const productsCreatedHookHandler = async ({
  products,
  additional_data,
  container,
}: ProductsCreatedHookInput) => {
  const adminAttributeInputs = (additional_data?.admin_attributes ??
    []) as AdminAttributeInput[];
  const vendorAttributeInputs = (additional_data?.vendor_attributes ??
    []) as VendorAttributeInput[];
  const sellerId = additional_data?.seller_id as string | undefined;

  if (!adminAttributeInputs.length && !vendorAttributeInputs.length) {
    return [];
  }

  for (const product of products) {
    const applicableAttributes = await getApplicableAttributes(
      container,
      product.id,
      ["id", "name", "is_required", "possible_values.value"]
    );

    const requiredAttributes = applicableAttributes.filter(
      (attr) => attr.is_required
    );

    const missingAttributes = arrayDifference(
      requiredAttributes.map((attr) => attr.id),
      adminAttributeInputs.map((attr) => attr.attribute_id)
    );

    if (missingAttributes.length) {
      const missingNames = requiredAttributes
        .filter((attr) => missingAttributes.includes(attr.id))
        .map((attr) => attr.name);
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Missing required attributes for product "${product.title}": ${missingNames.join(
          ", "
        )}`
      );
    }

    const attributesById = new Map(
      applicableAttributes.map((attribute) => [attribute.id, attribute])
    );

    // Process ALL admin attributes - create AttributeValues for filtering
    // regardless of whether they're also used for variations
    for (const adminAttr of adminAttributeInputs) {
      const attributeDef = ensureApplicableAttribute(
        adminAttr.attribute_id,
        attributesById,
        product.title
      );

      // Validate: if use_for_variations=true, a matching ProductOption must exist
      validateVariationAttributeHasOption(
        attributeDef.name,
        product,
        adminAttr.use_for_variations
      );

      // Create AttributeValues for ALL admin attributes (for Algolia filtering)
      await createAttributeValues(
        adminAttr,
        product,
        container,
        attributeDef
      );
    }

    // Process vendor attributes - only create AttributeValues when NOT used for variations
    // Vendor attributes are never filterable, so when use_for_variations=true,
    // the data is already in ProductOption and there's no benefit to duplicating it
    for (const vendorAttr of vendorAttributeInputs) {
      if (vendorAttr.use_for_variations) {
        // Skip - data will be in ProductOption, no need for AttributeValue
        continue;
      }

      if (!sellerId) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "seller_id is required for vendor attributes"
        );
      }

      // Create AttributeValues only for informational vendor attributes
      await createVendorAttributes(vendorAttr, product.id, sellerId, container);
    }
  }
};

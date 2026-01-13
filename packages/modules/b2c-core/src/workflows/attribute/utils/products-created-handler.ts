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

    for (const adminAttr of adminAttributeInputs) {
      if (adminAttr.use_for_variations) {
        continue;
      }

      const attributeDef = ensureApplicableAttribute(
        adminAttr.attribute_id,
        attributesById,
        product.title
      );

      await createAttributeValues(
        adminAttr,
        product,
        container,
        attributeDef
      );
    }

    for (const vendorAttr of vendorAttributeInputs) {
      if (vendorAttr.use_for_variations) {
        continue;
      }

      if (!sellerId) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "seller_id is required for vendor attributes"
        );
      }

      await createVendorAttributes(vendorAttr, product.id, sellerId, container);
    }
  }
};

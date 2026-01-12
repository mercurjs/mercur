import { MedusaContainer, ProductDTO } from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  MedusaError,
  arrayDifference,
} from "@medusajs/framework/utils";

import {
  AdminAttributeInput,
  AttributeUIComponent,
  VendorAttributeInput,
} from "@mercurjs/framework";

import { getApplicableAttributes } from "../../../shared/infra/http/utils/products";
import { createAttributeValueWorkflow } from "../../../workflows/attribute/workflows";
import { createVendorProductAttributeWorkflow } from "../../../workflows/vendor-product-attribute/workflows";

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
  const adminAttributes = (additional_data?.admin_attributes ??
    []) as AdminAttributeInput[];
  const vendorAttributes = (additional_data?.vendor_attributes ??
    []) as VendorAttributeInput[];
  const sellerId = additional_data?.seller_id as string | undefined;

  // If no attributes provided, skip processing
  if (!adminAttributes.length && !vendorAttributes.length) {
    return [];
  }

  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  for (const product of products) {
    // Get applicable attributes for this product (based on category)
    const applicableAttributes = await getApplicableAttributes(
      container,
      product.id,
      ["id", "name", "is_required", "possible_values.value"]
    );

    // Check for missing required attributes
    const requiredAttributes = applicableAttributes.filter(
      (attr) => attr.is_required
    );

    // An attribute is satisfied if it's in admin_attributes OR if it becomes an option (use_for_variations)
    const providedAttributeIds = adminAttributes.map(
      (attr) => attr.attribute_id
    );

    const missingAttributes = arrayDifference(
      requiredAttributes.map((attr) => attr.id),
      providedAttributeIds
    );

    if (missingAttributes.length) {
      const missingNames = requiredAttributes
        .filter((attr) => missingAttributes.includes(attr.id))
        .map((attr) => attr.name);
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Missing required attributes for product "${product.title}": ${missingNames.join(", ")}`
      );
    }

    // Process admin attributes (toggle OFF = AttributeValue)
    for (const adminAttr of adminAttributes) {
      if (adminAttr.use_for_variations) {
        // Skip - variants are created by frontend via core Medusa flows
        continue;
      }

      // Validate values against possible_values
      const attributeDef = applicableAttributes.find(
        (attr) => attr.id === adminAttr.attribute_id
      );
      if (!attributeDef) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Attribute ${adminAttr.attribute_id} is not applicable to this product's category`
        );
      }

      const allowedValues =
        attributeDef.possible_values?.map((pv) => pv.value) ?? [];

      for (const value of adminAttr.values) {
        // Validate value is in possible_values (if defined)
        if (allowedValues.length && !allowedValues.includes(value)) {
          throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            `Value "${value}" is not allowed for attribute "${attributeDef.name}". Allowed values: ${allowedValues.join(", ")}`
          );
        }

        // Create AttributeValue record
        await createAttributeValueWorkflow(container).run({
          input: {
            attribute_id: adminAttr.attribute_id,
            value: value,
            product_id: product.id,
          },
        });
      }
    }

    // Process vendor attributes (toggle OFF = VendorProductAttribute)
    for (const vendorAttr of vendorAttributes) {
      if (vendorAttr.use_for_variations) {
        // Skip - variants are created by frontend via core Medusa flows
        continue;
      }

      if (!sellerId) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "seller_id is required for vendor attributes"
        );
      }

      // For each value, create a VendorProductAttribute
      for (const value of vendorAttr.values) {
        await createVendorProductAttributeWorkflow(container).run({
          input: {
            title: vendorAttr.title,
            value: value,
            product_id: product.id,
            seller_id: sellerId,
            ui_component:
              (vendorAttr.ui_component as AttributeUIComponent) ??
              AttributeUIComponent.TEXTAREA,
            extends_attribute_id: vendorAttr.extends_attribute_id,
          },
        });
      }
    }
  }
};

import { MedusaContainer } from "@medusajs/framework/types";

import {
  AttributeSource,
  AttributeUIComponent,
  VendorAttributeInput,
} from "@mercurjs/framework";

import { createAndLinkAttributeValuesWorkflow } from "../workflows/create-and-link-attribute-values";
import { findOrCreateVendorAttribute } from "./find-or-create-vendor-attribute";

/**
 * Creates vendor attribute values for a product using the consolidated Attribute model.
 * Finds or creates the vendor attribute definition, then creates AttributeValues.
 */
export const createVendorAttributes = async (
  vendorAttr: VendorAttributeInput,
  product_id: string,
  sellerId: string,
  container: MedusaContainer
) => {
  // Find or create the vendor attribute definition
  const attribute = await findOrCreateVendorAttribute(container, {
    sellerId,
    name: vendorAttr.name,
    ui_component:
      (vendorAttr.ui_component as AttributeUIComponent) ??
      AttributeUIComponent.TEXTAREA,
  });

  await createAndLinkAttributeValuesWorkflow(container).run({
    input: {
      product_id,
      attribute_id: attribute.id,
      seller_id: sellerId,
      values: vendorAttr.values.map((value) => ({
        value,
        source: AttributeSource.VENDOR,
      })),
    },
  });
};

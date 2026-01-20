import { MedusaContainer } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

import {
  AttributeSource,
  AttributeUIComponent,
  VendorAttributeInput,
} from "@mercurjs/framework";

import { ATTRIBUTE_MODULE, AttributeModuleService } from "../../../modules/attribute";
import { SELLER_MODULE } from "../../../modules/seller";
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
  const attributeService = container.resolve<AttributeModuleService>(ATTRIBUTE_MODULE);
  const linkService = container.resolve(ContainerRegistrationKeys.LINK);

  // Find or create the vendor attribute definition
  const attribute = await findOrCreateVendorAttribute(container, {
    sellerId,
    name: vendorAttr.name,
    ui_component:
      (vendorAttr.ui_component as AttributeUIComponent) ??
      AttributeUIComponent.TEXTAREA,
  });

  // Create AttributeValues for each value
  for (const value of vendorAttr.values) {
    const attributeValue = await attributeService.createAttributeValues({
      value,
      attribute_id: attribute.id,
      source: AttributeSource.VENDOR,
      rank: 0,
    });

    // Link value to product
    await linkService.create({
      [Modules.PRODUCT]: { product_id },
      [ATTRIBUTE_MODULE]: { attribute_value_id: attributeValue.id },
    });

    // Link value to seller for ownership tracking
    await linkService.create({
      [SELLER_MODULE]: { seller_id: sellerId },
      [ATTRIBUTE_MODULE]: { attribute_value_id: attributeValue.id },
    });
  }
};

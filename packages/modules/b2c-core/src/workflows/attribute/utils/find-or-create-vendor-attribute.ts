import { MedusaContainer } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

import {
  AttributeSource,
  AttributeUIComponent,
} from "@mercurjs/framework";

import { ATTRIBUTE_MODULE, AttributeModuleService } from "../../../modules/attribute";
import { SELLER_MODULE } from "../../../modules/seller";
import sellerAttributeLink from "../../../links/seller-attribute";

interface FindOrCreateVendorAttributeInput {
  sellerId: string;
  name: string;
  ui_component?: AttributeUIComponent;
}

/**
 * Generates a unique handle for a vendor attribute.
 * Format: vendor_{seller_id_suffix}_{slugified_name}
 */
function generateVendorAttributeHandle(sellerId: string, name: string): string {
  const sellerSuffix = sellerId.slice(-8);
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return `vendor_${sellerSuffix}_${slug}`;
}

/**
 * Finds an existing vendor attribute by seller and name, or creates a new one.
 * Vendor attributes are deduplicated by (seller_id, normalized_name).
 */
export async function findOrCreateVendorAttribute(
  container: MedusaContainer,
  input: FindOrCreateVendorAttributeInput
): Promise<{ id: string; name: string; isNew: boolean }> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const attributeService = container.resolve<AttributeModuleService>(ATTRIBUTE_MODULE);
  const linkService = container.resolve(ContainerRegistrationKeys.LINK);

  const normalizedName = input.name.trim();
  const handle = generateVendorAttributeHandle(input.sellerId, normalizedName);

  // Look for existing vendor attribute using a precise, indexed query.
  // Handle is generated deterministically from sellerId + name, so it uniquely identifies vendor attributes.
  const {
    data: [existingAttribute],
  } = await query.graph({
    entity: "attribute",
    fields: ["id", "name"],
    filters: {
      source: AttributeSource.VENDOR,
      handle,
    },
  });

  if (existingAttribute) {
    return {
      id: existingAttribute.id,
      name: existingAttribute.name,
      isNew: false,
    };
  }

  // Create new vendor attribute
  const newAttribute = await attributeService.createAttributes({
    name: normalizedName,
    handle,
    source: AttributeSource.VENDOR,
    is_filterable: false,
    is_required: false,
    ui_component: input.ui_component ?? AttributeUIComponent.TEXTAREA,
  });

  // Link attribute to seller
  await linkService.create({
    [SELLER_MODULE]: { seller_id: input.sellerId },
    [ATTRIBUTE_MODULE]: { attribute_id: newAttribute.id },
  });

  return {
    id: newAttribute.id,
    name: newAttribute.name,
    isNew: true,
  };
}

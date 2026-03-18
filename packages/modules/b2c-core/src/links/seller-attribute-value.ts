import { defineLink } from "@medusajs/framework/utils";

import AttributeModule from "../modules/attribute";
import SellerModule from "../modules/seller";

/**
 * Link between Seller and AttributeValue
 * Used for vendor-created attribute values (source: "vendor")
 * This includes both:
 * - Values on vendor-created attributes
 * - Extension values on admin attributes (values not in possible_values)
 */
export default defineLink(SellerModule.linkable.seller, {
  linkable: AttributeModule.linkable.attributeValue,
  isList: true,
});

import { defineLink } from "@medusajs/framework/utils";

import AttributeModule from "../modules/attribute";
import SellerModule from "../modules/seller";

/**
 * Link between Seller and Attribute
 * Used for vendor-created attribute definitions (source: "vendor")
 */
export default defineLink(SellerModule.linkable.seller, {
  linkable: AttributeModule.linkable.attribute,
  isList: true,
});

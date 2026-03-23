import { defineLink } from "@medusajs/framework/utils";

import SellerModule from "../modules/seller";
import VendorProductAttributeModule from "../modules/vendor-product-attribute";

export default defineLink(SellerModule.linkable.seller, {
  linkable: VendorProductAttributeModule.linkable.vendorProductAttribute,
  isList: true,
});

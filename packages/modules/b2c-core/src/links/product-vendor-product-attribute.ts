import { defineLink } from "@medusajs/framework/utils";
import ProductModule from "@medusajs/medusa/product";

import VendorProductAttributeModule from "../modules/vendor-product-attribute";

export default defineLink(
  {
    linkable: ProductModule.linkable.product,
    isList: true,
  },
  {
    linkable: VendorProductAttributeModule.linkable.vendorProductAttribute,
    isList: true,
  }
);

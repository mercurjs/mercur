import { Module } from "@medusajs/framework/utils";

import VendorProductAttributeModuleService from "./service";

export const VENDOR_PRODUCT_ATTRIBUTE_MODULE = "vendor_product_attribute";
export { VendorProductAttributeModuleService };

export default Module(VENDOR_PRODUCT_ATTRIBUTE_MODULE, {
  service: VendorProductAttributeModuleService,
});

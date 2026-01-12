import { Module } from "@medusajs/framework/utils";

import VendorProductAttributeModuleService from "./service";

export const VENDOR_PRODUCT_ATTRIBUTE_MODULE = "vendorProductAttribute";
export { VendorProductAttributeModuleService };

export default Module(VENDOR_PRODUCT_ATTRIBUTE_MODULE, {
  service: VendorProductAttributeModuleService,
});

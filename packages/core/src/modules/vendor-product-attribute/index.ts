import { Module } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"

import VendorProductAttributeModuleService from "./service"

export const VENDOR_PRODUCT_ATTRIBUTE_MODULE =
  MercurModules.VENDOR_PRODUCT_ATTRIBUTE
export { VendorProductAttributeModuleService }

export default Module(VENDOR_PRODUCT_ATTRIBUTE_MODULE, {
  service: VendorProductAttributeModuleService,
})

import { Module } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"

import ProductAttributeModuleService from "./service"

export { ProductAttributeModuleService }

export default Module(MercurModules.PRODUCT_ATTRIBUTE, {
  service: ProductAttributeModuleService,
})

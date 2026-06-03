import { Module } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"

import ProductChangeModuleService from "./service"

export { ProductChangeModuleService }

export default Module(MercurModules.PRODUCT_EDIT, {
  service: ProductChangeModuleService,
})

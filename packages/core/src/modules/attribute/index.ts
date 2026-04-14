import { Module } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"

import AttributeModuleService from "./service"

export const ATTRIBUTE_MODULE = MercurModules.ATTRIBUTE
export { AttributeModuleService }

export default Module(ATTRIBUTE_MODULE, {
  service: AttributeModuleService,
})

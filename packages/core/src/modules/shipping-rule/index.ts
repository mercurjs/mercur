import { Module } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"

import ShippingRuleModuleService from "./service"

export default Module(MercurModules.SHIPPING_RULE, {
  service: ShippingRuleModuleService,
})

import { Module } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"

import SubscriptionModuleService from "./service"

export default Module(MercurModules.SUBSCRIPTION, {
  service: SubscriptionModuleService,
})

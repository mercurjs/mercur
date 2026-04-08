import { Module } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"

import ServiceFeeModuleService from "./service"

export default Module(MercurModules.SERVICE_FEE, {
  service: ServiceFeeModuleService,
})

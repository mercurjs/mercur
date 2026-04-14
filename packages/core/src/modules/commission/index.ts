import { Module } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"

import CommissionModuleService from "./service"

export default Module(MercurModules.COMMISSION, {
  service: CommissionModuleService,
})

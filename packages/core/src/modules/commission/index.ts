import { Module } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"

import CommissionModuleService from "./service"
import seedDefaultCommissionRateLoader from "./loaders/seed-default-commission-rate"

export default Module(MercurModules.COMMISSION, {
  service: CommissionModuleService,
  loaders: [seedDefaultCommissionRateLoader],
})

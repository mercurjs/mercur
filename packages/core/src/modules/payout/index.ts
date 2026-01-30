import { Module } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"

import PayoutModuleService from "./services/payout-module-service"
import loadProviders from "./loaders/provider"

export default Module(MercurModules.PAYOUT, {
  service: PayoutModuleService,
  loaders: [loadProviders],
})

import { Module } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"

import PayoutService from "./services/payout-service"
import loadProviders from "./loaders/provider"

export default Module(MercurModules.PAYOUT, {
  service: PayoutService,
  loaders: [loadProviders],
})

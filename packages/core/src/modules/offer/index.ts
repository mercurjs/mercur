import { Module } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"

import OfferModuleService from "./service"

export default Module(MercurModules.OFFER, {
  service: OfferModuleService,
})

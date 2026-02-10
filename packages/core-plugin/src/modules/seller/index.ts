import { Module } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"

import SellerModuleService from "./service"

export default Module(MercurModules.SELLER, {
  service: SellerModuleService,
})

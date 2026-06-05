import { Module } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"

import SellerModuleService from "./service"
import registerFeatureFlagsLoader from "./loaders/register-feature-flags"

export default Module(MercurModules.SELLER, {
  service: SellerModuleService,
  loaders: [registerFeatureFlagsLoader],
})

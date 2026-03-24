import { Module } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"

import SellerModuleService from "./service"
import sellerMemberRbacRoleLoader from "./loaders"

export default Module(MercurModules.SELLER, {
  service: SellerModuleService,
  loaders: [sellerMemberRbacRoleLoader],
})

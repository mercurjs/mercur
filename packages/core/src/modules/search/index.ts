import { Module } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"

import SearchModuleService from "./service"

export default Module(MercurModules.SEARCH, {
  service: SearchModuleService,
})

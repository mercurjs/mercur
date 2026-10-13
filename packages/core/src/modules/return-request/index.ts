import { Module } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"

import ReturnRequestModuleService from "./service"

export { ReturnRequestModuleService }

export default Module(MercurModules.RETURN_REQUEST, {
  service: ReturnRequestModuleService,
})

import { Module } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"

import MediaModuleService from "./service"

export default Module(MercurModules.MEDIA, {
  service: MediaModuleService,
})

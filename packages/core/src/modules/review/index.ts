import { Module } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"

import ReviewModuleService from "./service"

export default Module(MercurModules.REVIEW, {
  service: ReviewModuleService,
})

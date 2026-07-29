import { Module } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"

import ReviewModuleService from "./service"

export * from "./types"
export { ReviewModuleService }

export default Module(MercurModules.REVIEW, {
  service: ReviewModuleService,
})

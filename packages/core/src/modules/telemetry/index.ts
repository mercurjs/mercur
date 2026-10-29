import { Module } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"

import TelemetryModuleService from "./service"

export default Module(MercurModules.TELEMETRY, {
  service: TelemetryModuleService,
})

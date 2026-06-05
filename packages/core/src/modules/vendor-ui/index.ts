import { Module } from "@medusajs/framework/utils"
import VendorUIModuleService from "./services/vendor-ui-module-service"
import { MercurModules } from "@mercurjs/types"

export default Module(MercurModules.VENDOR_UI, {
    service: VendorUIModuleService,
})
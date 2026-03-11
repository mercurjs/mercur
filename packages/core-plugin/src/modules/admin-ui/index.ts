import { Module } from "@medusajs/framework/utils"
import AdminUIModuleService from "./services/admin-ui-module-service"
import { MercurModules } from "@mercurjs/types"

export default Module(MercurModules.ADMIN_UI, {
    service: AdminUIModuleService,
})

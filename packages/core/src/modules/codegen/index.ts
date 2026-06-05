import { Module } from "@medusajs/framework/utils"
import CodegenModuleService from "./services/codegen-module-service"
import { MercurModules } from "@mercurjs/types"

export default Module(MercurModules.CODEGEN, {
    service: CodegenModuleService,
})

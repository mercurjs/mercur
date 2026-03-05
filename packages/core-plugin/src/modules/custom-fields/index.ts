import { Module } from "@medusajs/framework/utils"
import CustomFieldsModuleService from "./services/custom-fields-module-service"
import customFieldsLoader from "./loaders"

export const CUSTOM_FIELDS_MODULE = "custom_fields"

export { BaseField, EnumField, Field, CustomFieldsModuleOptions } from "@mercurjs/types"

export default Module(CUSTOM_FIELDS_MODULE, {
    service: CustomFieldsModuleService,
    loaders: [customFieldsLoader],
})
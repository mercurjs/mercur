import { Module } from "@medusajs/framework/utils"
import SampleModuleService from "./service"

export const SAMPLE_MODULE = "sample"

export default Module(SAMPLE_MODULE, {
  service: SampleModuleService,
})

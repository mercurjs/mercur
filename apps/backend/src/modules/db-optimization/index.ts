import DbOptimizationService from "./service"
import { Module } from "@medusajs/framework/utils"

export const DB_OPTIMIZATION_MODULE = "dbOptimization"

export default Module(DB_OPTIMIZATION_MODULE, {
  service: DbOptimizationService,
})

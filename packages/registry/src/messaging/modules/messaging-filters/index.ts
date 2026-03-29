import { Module } from "@medusajs/framework/utils"

import MessagingFiltersModuleService from "./service"
import seedBuiltinRules from "./loaders/seed-builtin-rules"
import compileFiltersLoader from "./loaders/compile-filters"

export const MESSAGING_FILTERS_MODULE = "messagingFilters"

export * from "./types/common"
export { MessagingFiltersModuleService }

export default Module(MESSAGING_FILTERS_MODULE, {
  service: MessagingFiltersModuleService,
  loaders: [seedBuiltinRules, compileFiltersLoader],
})

import { Module } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"

import SearchModuleService from "./services/search-module-service"
import loadProviders from "./loaders/providers"

export { AbstractSearchProvider } from "./abstract-search-provider"
export { default as SearchModuleService } from "./services/search-module-service"
export {
  SearchProviderRegistrationPrefix,
  SearchProviderIdentifierRegistrationName,
} from "./services/search-provider-service"
export { reindexAll, indexProductPage } from "./lib/reindex"

export default Module(MercurModules.SEARCH, {
  service: SearchModuleService,
  loaders: [loadProviders],
})

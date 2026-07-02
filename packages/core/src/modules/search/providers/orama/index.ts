import { ModuleProvider } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"

import { OramaSearchProvider } from "./service"

export { OramaSearchProvider } from "./service"
export { OramaSearchFiltersSchema } from "./validators"
export type { OramaSearchFilters } from "./validators"
export type { OramaSearchQuery } from "./types"

export default ModuleProvider(MercurModules.SEARCH, {
  services: [OramaSearchProvider],
})

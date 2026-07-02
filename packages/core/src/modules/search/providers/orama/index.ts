import { ModuleProvider } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"

import { OramaSearchProvider } from "./service"

export { OramaSearchProvider } from "./service"
export type { OramaSearchQuery } from "./types"

export default ModuleProvider(MercurModules.SEARCH, {
  services: [OramaSearchProvider],
})

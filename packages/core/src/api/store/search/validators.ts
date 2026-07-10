import { z } from "zod"
import { createFindParams } from "@medusajs/medusa/api/utils/validators"

import { SearchQueryFiltersSchema } from "../../../modules/search/validators"

export type StoreGetSearchParamsType = z.infer<typeof StoreGetSearchParams>
export const StoreGetSearchParams = createFindParams({
  offset: 0,
  limit: 20,
}).merge(SearchQueryFiltersSchema)

import { z } from "zod"
import { createFindParams } from "@medusajs/medusa/api/utils/validators"
import { booleanString } from "@medusajs/medusa/api/utils/common-validators/common"

const StoreSearchFilterFields = z.object({
  q: z.string().optional(),
  region_id: z.string(),
  category_id: z.union([z.string(), z.array(z.string())]).optional(),
  collection_id: z.union([z.string(), z.array(z.string())]).optional(),
  type_id: z.union([z.string(), z.array(z.string())]).optional(),
  tag_id: z.union([z.string(), z.array(z.string())]).optional(),
  seller_id: z.union([z.string(), z.array(z.string())]).optional(),
  attributes: z
    .record(z.string(), z.union([z.string(), z.array(z.string())]))
    .optional(),
  min_price: z.coerce.number().optional(),
  max_price: z.coerce.number().optional(),
  facets: booleanString().optional(),
})

export type StoreGetSearchParamsType = z.infer<typeof StoreGetSearchParams>
export const StoreGetSearchParams = createFindParams({
  offset: 0,
  limit: 20,
}).merge(StoreSearchFilterFields)

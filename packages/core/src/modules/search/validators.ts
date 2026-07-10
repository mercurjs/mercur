import { z } from "zod"

export const SearchQueryFiltersSchema = z.object({
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
})

export type SearchQueryFilters = z.infer<typeof SearchQueryFiltersSchema>

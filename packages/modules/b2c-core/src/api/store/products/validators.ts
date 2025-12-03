import { z } from 'zod'

export type StoreSearchProductsType = z.infer<typeof StoreSearchProductsSchema>

export const StoreSearchProductsSchema = z.object({
  query: z.string().default(''),
  page: z.coerce.number().int().min(0).default(0),
  hitsPerPage: z.coerce.number().int().min(1).max(100).default(12),
  filters: z.string().optional(),
  facets: z.array(z.string()).optional(),
  maxValuesPerFacet: z.coerce.number().int().min(1).max(1000).optional(),
  currency_code: z.string().length(3).optional(),
  region_id: z.string().optional()
})


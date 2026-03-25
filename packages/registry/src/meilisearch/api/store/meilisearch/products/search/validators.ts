import { z } from 'zod'

export const StoreMeilisearchFiltersSchema = z.object({
  categories: z.array(z.string().min(1)).optional(),
  price_min: z.number().min(0).optional(),
  price_max: z.number().min(0).optional(),
  seller_handle: z.string().min(1).optional(),
})

export const StoreMeilisearchSearchSchema = z.object({
  query: z.string().default(''),
  page: z.coerce.number().int().min(1).default(1),
  hitsPerPage: z.coerce.number().int().min(1).max(100).default(12),
  filters: StoreMeilisearchFiltersSchema.optional(),
  currency_code: z.string().length(3).optional(),
  region_id: z.string().optional(),
  customer_id: z.string().optional(),
  customer_group_id: z.array(z.string()).optional(),
})

export type StoreMeilisearchSearchType = z.infer<typeof StoreMeilisearchSearchSchema>

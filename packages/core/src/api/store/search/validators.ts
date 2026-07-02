import { z } from "zod"

/**
 * Medusa-like store list params (`q` / `limit` / `offset`) plus the pricing/tax
 * context inputs (`region_id` / `country_code` / `province`, read by
 * `setSearchPricingContext`, mirroring `/store/products`). `filters` is an open
 * record passed straight to the active provider — the provider owns its filter
 * shape, so the route validates nothing beyond structure.
 */
export const StoreSearchSchema = z
  .object({
    q: z.string().optional().default(""),
    limit: z.coerce.number().int().min(1).max(100).optional().default(12),
    offset: z.coerce.number().int().min(0).optional().default(0),
    region_id: z.string().optional(),
    country_code: z.string().optional(),
    province: z.string().optional(),
    filters: z.record(z.string(), z.unknown()).optional(),
  })
  .strict()

export type StoreSearchType = z.infer<typeof StoreSearchSchema>

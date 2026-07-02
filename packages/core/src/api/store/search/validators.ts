import { z } from "zod"

// `filters` is passed straight to the active provider, which owns its shape.
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

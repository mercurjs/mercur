import { z } from "zod"

import { OramaSearchFiltersSchema } from "../../../modules/search/providers/orama"

export const StoreSearchSchema = z
  .object({
    query: z.string().optional().default(""),
    page: z.coerce.number().int().min(1).optional().default(1),
    hitsPerPage: z.coerce.number().int().min(1).max(100).optional().default(12),
    context: z
      .object({
        region_id: z.string().optional(),
        country_code: z.string().optional(),
        province: z.string().optional(),
      })
      .optional(),
    filters: OramaSearchFiltersSchema.optional(),
  })
  .strict()

export type StoreSearchType = z.infer<typeof StoreSearchSchema>

import { z } from "zod"

/**
 * Injection-safe token pattern (mirrors the Meili block). Attribute handles and
 * value ids are validated against it.
 */
const safeToken = z.string().regex(/^[a-zA-Z0-9_-]+$/)

/**
 * The filter shape `search-orama` accepts. The store route imports this so the
 * accepted filters always match what the backend can honour. `seller_status` is
 * omitted — the route forces it to `"open"` server-side.
 */
export const OramaSearchFiltersSchema = z
  .object({
    type: z.enum(["product", "offer"]).optional(),
    collection_ids: z.array(z.string()).optional(),
    category_ids: z.array(z.string()).optional(),
    seller_handle: safeToken.optional(),
    attributes: z.record(safeToken, z.array(safeToken)).optional(),
  })
  .strict()

export type OramaSearchFilters = z.infer<typeof OramaSearchFiltersSchema>

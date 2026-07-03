import { z } from "zod"

export const AllocateItemsSchema = z.object({
  location_id: z.string(),
  quantity: z.record(z.string(), z.number().or(z.string())),
  // Keyed by line item id. Defaults to selected; deselected items are
  // excluded from the allocation payload.
  selected: z.record(z.string(), z.boolean()),
})

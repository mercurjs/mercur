import { z } from "zod"

export const CreateFulfillmentSchema = z.object({
  quantity: z.record(z.string(), z.number()),
  // Per-item inclusion. Items default to selected; deselecting one
  // excludes it from the fulfillment payload.
  selection: z.record(z.string(), z.boolean()).optional(),
  location_id: z.string(),
  shipping_option_id: z.string().optional(),
  send_notification: z.boolean().optional(),
})

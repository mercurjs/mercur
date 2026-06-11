import { z } from "zod"

export const ReceiveReturnSchema = z.object({
  location_id: z.string().min(1),
  items: z.array(
    z.object({
      quantity: z.number().nullish(),
      dismissed_quantity: z.number().nullish(),
      item_id: z.string(),
    })
  ),
  send_notification: z.boolean().optional(),
})

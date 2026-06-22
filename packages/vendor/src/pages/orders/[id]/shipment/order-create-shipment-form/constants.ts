import { z } from "zod"

export const CreateShipmentSchema = z.object({
  labels: z.array(
    z.object({
      tracking_number: z.string(),
      tracking_url: z.string().optional(),
    })
  ),
  notify: z.boolean().optional(),
})

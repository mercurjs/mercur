import { z } from "zod"

export const ReturnCreateSchema = z.object({
  items: z.array(
    z.object({
      item_id: z.string(),
      quantity: z.number(),
      reason_id: z.string().optional().nullable(),
      note: z.string().optional().nullable(),
    })
  ),
  location_id: z.string().optional(),
  option_id: z.string(),
  send_notification: z.boolean().optional(),
  // TODO: receive flow happens on a separate route — left here for parity
  // with the admin schema and possible future inline-receive support.
  receive_now: z.boolean().optional(),
})

export type ReturnCreateSchemaType = z.infer<typeof ReturnCreateSchema>

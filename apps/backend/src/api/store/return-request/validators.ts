import { z } from 'zod'

export type StoreCreateReturnRequestType = z.infer<
  typeof StoreCreateReturnRequest
>
export const StoreCreateReturnRequest = z
  .object({
    order_id: z.string(),
    line_items: z.array(z.string()),
    customer_note: z.string()
  })
  .strict()

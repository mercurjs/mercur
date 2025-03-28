import { z } from 'zod'

export type CreateQuickOrderType = z.infer<typeof CreateQuickOrder>
export const CreateQuickOrder = z.object({
  region_id: z.string(),
  items: z.array(
    z.object({
      variant_id: z.string(),
      quantity: z.number()
    })
  )
})

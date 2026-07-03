import { z } from "zod"

export const EditOfferSchema = z.object({
  sku: z.string().min(1).max(64),
  shipping_profile_id: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()).nullish(),
})

export type EditOfferFormValues = z.infer<typeof EditOfferSchema>

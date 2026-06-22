import { z } from "zod"

const PriceCellSchema = z.union([z.coerce.number().min(0), z.literal("")])

const PriceRowSchema = z.object({
  id: z.string(),
  currency_prices: z.record(z.string(), PriceCellSchema).default({}),
})

export const PricingFormSchema = z.object({
  prices: z.array(PriceRowSchema).min(1),
})

export type PricingRow = z.infer<typeof PriceRowSchema>
export type PricingFormValues = z.infer<typeof PricingFormSchema>

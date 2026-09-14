import { z } from "zod"

import { optionalFloat } from "../../../../../lib/validation"

const PriceCellSchema = optionalFloat

const PriceRowSchema = z.object({
  id: z.string(),
  currency_prices: z.record(z.string(), PriceCellSchema).default({}),
})

export const PricingFormSchema = z.object({
  prices: z.array(PriceRowSchema).min(1),
})

export type PricingRow = z.infer<typeof PriceRowSchema>
export type PricingFormValues = z.infer<typeof PricingFormSchema>

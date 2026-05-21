import { z } from "zod"

const PriceRowSchema = z
  .object({
    id: z.string().optional(),
    amount: z.coerce.number().nonnegative(),
    currency_code: z.string().min(1),
    region_id: z.string().nullish(),
    customer_group_id: z.string().nullish(),
    min_quantity: z
      .union([z.coerce.number().int().positive(), z.literal("")])
      .optional()
      .transform((v) => (v === "" || v === undefined ? null : v)),
    max_quantity: z
      .union([z.coerce.number().int().positive(), z.literal("")])
      .optional()
      .transform((v) => (v === "" || v === undefined ? null : v)),
  })
  .strict()

export const PricingFormSchema = z.object({
  prices: z.array(PriceRowSchema).min(1),
})

export type PricingFormValues = z.infer<typeof PricingFormSchema>

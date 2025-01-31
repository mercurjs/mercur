import { z } from 'zod'

const TaxBreakdownObject = z.object({
  amount: z.number(),
  taxable_amount: z.number(),
  sourcing: z.string(),
  tax_rate_details: z.array(
    z.object({
      display_name: z.string(),
      percentage_decimal: z.string(),
      tax_type: z.string()
    })
  )
})

export const StripeTaxCalculationResponseValidator = z.object({
  id: z.string(),
  line_items: z.object({
    has_more: z.boolean(),
    total_count: z.number(),
    data: z.array(
      z.object({
        reference: z.string(),
        amount: z.number(),
        amount_tax: z.number(),
        tax_behavior: z.string(),
        tax_breakdown: z.array(TaxBreakdownObject),
        tax_code: z.string(),
        quantity: z.number()
      })
    )
  }),
  shipping_cost: z.object({
    amount: z.number(),
    amount_tax: z.number(),
    tax_code: z.string(),
    tax_behavior: z.string(),
    tax_breakdown: z.array(TaxBreakdownObject)
  })
})

export type StripeTaxCalculationResponse = z.infer<
  typeof StripeTaxCalculationResponseValidator
>

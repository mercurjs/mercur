import { z } from 'zod'

import { PriceListStatus, PriceListType } from '@medusajs/framework/utils'
import { createSelectParams } from '@medusajs/medusa/api/utils/validators'

export const VendorGetPriceListPricesParams = createSelectParams()

export type VendorCreatePriceListPriceType = z.infer<
  typeof VendorCreatePriceListPrice
>
export const VendorCreatePriceListPrice = z.object({
  currency_code: z.string(),
  amount: z.number(),
  variant_id: z.string(),
  min_quantity: z.number().nullish(),
  max_quantity: z.number().nullish(),
  rules: z.record(z.string(), z.string()).optional()
})

export type VendorCreatePriceListType = z.infer<typeof VendorCreatePriceList>
export const VendorCreatePriceList = z.object({
  title: z.string(),
  description: z.string(),
  starts_at: z.string().nullish(),
  ends_at: z.string().nullish(),
  status: z.nativeEnum(PriceListStatus).optional(),
  type: z.nativeEnum(PriceListType).optional(),
  rules: z.record(z.string(), z.array(z.string())).optional(),
  prices: z.array(VendorCreatePriceListPrice).optional()
})

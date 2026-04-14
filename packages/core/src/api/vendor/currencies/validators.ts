import { z } from "zod"
import { createFindParams, createSelectParams } from "@medusajs/medusa/api/utils/validators"

export const VendorGetCurrencyParams = createSelectParams()

export const VendorGetCurrenciesParamsFields = z.object({
  q: z.string().optional(),
  code: z.union([z.string(), z.array(z.string())]).optional(),
})

export type VendorGetCurrenciesParamsType = z.infer<
  typeof VendorGetCurrenciesParams
>
export const VendorGetCurrenciesParams = createFindParams({
  offset: 0,
  limit: 200,
}).merge(VendorGetCurrenciesParamsFields)

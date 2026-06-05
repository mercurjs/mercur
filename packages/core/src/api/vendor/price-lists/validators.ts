import { PriceListStatus, PriceListType } from "@medusajs/framework/utils"
import { z } from "zod"
import {
  createFindParams,
  createOperatorMap,
  createSelectParams,
} from "@medusajs/medusa/api/utils/validators"

export type VendorGetPriceListParamsType = z.infer<
  typeof VendorGetPriceListParams
>
export const VendorGetPriceListParams = createSelectParams()

export type VendorGetPriceListsParamsType = z.infer<
  typeof VendorGetPriceListsParams
>
export const VendorGetPriceListsParams = createFindParams({
  offset: 0,
  limit: 50,
}).merge(
  z.object({
    q: z.string().optional(),
    id: z.union([z.string(), z.array(z.string())]).optional(),
    starts_at: createOperatorMap().optional(),
    ends_at: createOperatorMap().optional(),
    status: z.array(z.nativeEnum(PriceListStatus)).optional(),
  })
)

export type VendorCreatePriceListPriceType = z.infer<
  typeof VendorCreatePriceListPrice
>
export const VendorCreatePriceListPrice = z.object({
  currency_code: z.string(),
  amount: z.number(),
  variant_id: z.string(),
  min_quantity: z.number().nullish(),
  max_quantity: z.number().nullish(),
  rules: z.record(z.string(), z.string()).optional(),
})

export type VendorUpdatePriceListPriceType = z.infer<
  typeof VendorUpdatePriceListPrice
>
export const VendorUpdatePriceListPrice = z.object({
  id: z.string(),
  currency_code: z.string().optional(),
  amount: z.number().optional(),
  variant_id: z.string(),
  min_quantity: z.number().nullish(),
  max_quantity: z.number().nullish(),
  rules: z.record(z.string(), z.string()).optional(),
})

export type VendorGetPriceListPricesParamsType = z.infer<
  typeof VendorGetPriceListPricesParams
>
export const VendorGetPriceListPricesParams = createFindParams({
  offset: 0,
  limit: 50,
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
  prices: z.array(VendorCreatePriceListPrice).optional(),
})

export type VendorUpdatePriceListType = z.infer<typeof VendorUpdatePriceList>
export const VendorUpdatePriceList = z.object({
  title: z.string().optional(),
  description: z.string().nullish(),
  starts_at: z.string().nullish(),
  ends_at: z.string().nullish(),
  status: z.nativeEnum(PriceListStatus).optional(),
  type: z.nativeEnum(PriceListType).optional(),
  rules: z.record(z.string(), z.array(z.string())).optional(),
})

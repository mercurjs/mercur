import { z } from "zod"
import {
  createFindParams,
  createOperatorMap,
  createSelectParams,
} from "@medusajs/medusa/api/utils/validators"

export type VendorGetStockLocationParamsType = z.infer<
  typeof VendorGetStockLocationParams
>
export const VendorGetStockLocationParams = createSelectParams()

export type VendorGetStockLocationsParamsType = z.infer<
  typeof VendorGetStockLocationsParams
>
export const VendorGetStockLocationsParams = createFindParams({
  offset: 0,
  limit: 20,
}).merge(
  z.object({
    q: z.string().optional(),
    id: z.union([z.string(), z.array(z.string())]).optional(),
    name: z.union([z.string(), z.array(z.string())]).optional(),
    created_at: createOperatorMap().optional(),
    updated_at: createOperatorMap().optional(),
  })
)

export const VendorUpsertStockLocationAddress = z.object({
  address_1: z.string(),
  address_2: z.string().nullish(),
  company: z.string().nullish(),
  city: z.string().nullish(),
  country_code: z.string(),
  phone: z.string().nullish(),
  postal_code: z.string().nullish(),
  province: z.string().nullish(),
})

export type VendorCreateStockLocationType = z.infer<
  typeof VendorCreateStockLocation
>
export const VendorCreateStockLocation = z.object({
  name: z.preprocess((val: any) => val.trim(), z.string()),
  address: VendorUpsertStockLocationAddress.optional(),
  address_id: z.string().nullish(),
  metadata: z.record(z.unknown()).nullish(),
})

export type VendorUpdateStockLocationType = z.infer<
  typeof VendorUpdateStockLocation
>
export const VendorUpdateStockLocation = z.object({
  name: z
    .preprocess((val: any) => val?.trim(), z.string().optional())
    .optional(),
  address: VendorUpsertStockLocationAddress.optional(),
  address_id: z.string().nullish(),
  metadata: z.record(z.unknown()).nullish(),
})

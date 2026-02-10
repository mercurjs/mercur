import { z } from "zod"
import {
  createFindParams,
  createSelectParams,
} from "@medusajs/medusa/api/utils/validators"

export type VendorGetSellerParamsType = z.infer<typeof VendorGetSellerParams>
export const VendorGetSellerParams = createSelectParams()

export type VendorGetSellersParamsType = z.infer<typeof VendorGetSellersParams>
export const VendorGetSellersParams = createFindParams({
  offset: 0,
  limit: 50,
})

export type VendorCreateSellerType = z.infer<typeof VendorCreateSeller>
export const VendorCreateSeller = z
  .object({
    name: z.preprocess((val: string) => val?.trim(), z.string().min(1)),
    handle: z.preprocess((val: string) => val?.trim(), z.string().min(1)).optional(),
    email: z.string().email(),
    phone: z.string().nullish(),
    logo: z.string().nullish(),
    cover_image: z.string().nullish(),
    address_1: z.string().nullish(),
    address_2: z.string().nullish(),
    city: z.string().nullish(),
    country_code: z.string().nullish(),
    province: z.string().nullish(),
    postal_code: z.string().nullish(),
  })
  .strict()

export type VendorUpdateSellerType = z.infer<typeof VendorUpdateSeller>
export const VendorUpdateSeller = z
  .object({
    name: z.preprocess((val: string) => val?.trim(), z.string().min(1)).optional(),
    handle: z.preprocess((val: string) => val?.trim(), z.string().min(1)).optional(),
    email: z.string().email().optional(),
    phone: z.string().nullish(),
    logo: z.string().nullish(),
    cover_image: z.string().nullish(),
    address_1: z.string().nullish(),
    address_2: z.string().nullish(),
    city: z.string().nullish(),
    country_code: z.string().nullish(),
    province: z.string().nullish(),
    postal_code: z.string().nullish(),
  })
  .strict()

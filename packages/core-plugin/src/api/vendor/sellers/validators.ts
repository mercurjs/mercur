import {
  createFindParams,
  createSelectParams,
} from "@medusajs/medusa/api/utils/validators"
import { z } from "zod"

export type VendorGetSellersParamsType = z.infer<typeof VendorGetSellersParams>
export const VendorGetSellersParams = createFindParams({
  offset: 0,
  limit: 50,
})

export type VendorGetSellerParamsType = z.infer<typeof VendorGetSellerParams>
export const VendorGetSellerParams = createSelectParams()

export type VendorCreateSellerType = z.infer<typeof VendorCreateSeller>
export const VendorCreateSeller = z
  .object({
    name: z.preprocess((val: string) => val?.trim(), z.string().min(1)),
    handle: z
      .preprocess((val: string) => val?.trim(), z.string().min(1))
      .optional(),
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
export const VendorUpdateSeller = z.object({
  name: z.string().optional(),
  description: z.string().nullable().optional(),
  logo: z.string().url().nullable().optional(),
  banner: z.string().url().nullable().optional(),
  website_url: z.string().nullable().optional(),
  closed_from: z.coerce.date().nullable().optional(),
  closed_to: z.coerce.date().nullable().optional(),
  metadata: z.record(z.unknown()).nullable().optional(),
})

export type VendorInviteMemberType = z.infer<typeof VendorInviteMember>
export const VendorInviteMember = z.object({
  email: z.string().email(),
  role_handle: z.string(),
})

export type VendorUpdateMemberRoleType = z.infer<typeof VendorUpdateMemberRole>
export const VendorUpdateMemberRole = z.object({
  role_handle: z.string(),
})

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

export type VendorCreateSellerAccountType = z.infer<typeof VendorCreateSellerAccount>
export const VendorCreateSellerAccount = z.object({
  name: z.string(),
  email: z.string().email(),
  description: z.string().nullable().optional(),
  currency_code: z.string(),
  address: z
    .object({
      company: z.string().nullable().optional(),
      first_name: z.string().optional(),
      last_name: z.string().optional(),
      address_1: z.string().optional(),
      address_2: z.string().nullable().optional(),
      city: z.string().optional(),
      country_code: z.string().optional(),
      province: z.string().nullable().optional(),
      postal_code: z.string().optional(),
      phone: z.string().nullable().optional(),
    })
    .optional(),
  metadata: z.record(z.unknown()).nullable().optional(),
})

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
  role_id: z.string(),
})

export type VendorUpdateMemberRoleType = z.infer<typeof VendorUpdateMemberRole>
export const VendorUpdateMemberRole = z.object({
  role_id: z.string(),
})

export type VendorUpsertSellerAddressType = z.infer<typeof VendorUpsertSellerAddress>
export const VendorUpsertSellerAddress = z.object({
  company: z.string().nullable().optional(),
  first_name: z.string().nullable().optional(),
  last_name: z.string().nullable().optional(),
  address_1: z.string().nullable().optional(),
  address_2: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  country_code: z.string().nullable().optional(),
  province: z.string().nullable().optional(),
  postal_code: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  metadata: z.record(z.unknown()).nullable().optional(),
})

export type VendorUpsertSellerPaymentDetailsType = z.infer<typeof VendorUpsertSellerPaymentDetails>
export const VendorUpsertSellerPaymentDetails = z.object({
  holder_name: z.string().optional(),
  bank_name: z.string().nullable().optional(),
  iban: z.string().nullable().optional(),
  bic: z.string().nullable().optional(),
  routing_number: z.string().nullable().optional(),
  account_number: z.string().nullable().optional(),
})

export type VendorUpsertSellerProfessionalDetailsType = z.infer<typeof VendorUpsertSellerProfessionalDetails>
export const VendorUpsertSellerProfessionalDetails = z.object({
  corporate_name: z.string().optional(),
  registration_number: z.string().nullable().optional(),
  tax_id: z.string().nullable().optional(),
})

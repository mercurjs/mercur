import { z } from "zod"
import {
  createFindParams,
  createOperatorMap,
  createSelectParams,
  WithAdditionalData,
} from "@medusajs/medusa/api/utils/validators"
import { booleanString } from "@medusajs/medusa/api/utils/common-validators/common"
import { AdditionalData } from "@medusajs/framework/types"
import { SellerRole } from "@mercurjs/types"

export type AdminGetSellerParamsType = z.infer<typeof AdminGetSellerParams>
export const AdminGetSellerParams = createSelectParams()

export type AdminGetSellersParamsType = z.infer<typeof AdminGetSellersParams>
export const AdminGetSellersParams = createFindParams({
  offset: 0,
  limit: 50,
}).merge(
  z.object({
    q: z.string().optional(),
    id: z.union([z.string(), z.array(z.string())]).optional(),
    name: z.union([z.string(), z.array(z.string())]).optional(),
    handle: z.string().optional(),
    email: z.string().optional(),
    status: z.union([z.string(), z.array(z.string())]).optional(),
    is_premium: booleanString().optional(),
    created_at: createOperatorMap().optional(),
    updated_at: createOperatorMap().optional(),
  })
)

export type AdminGetSellerProductsParamsType = z.infer<
  typeof AdminGetSellerProductsParams
>
export const AdminGetSellerProductsParams = createFindParams({
  offset: 0,
  limit: 50,
}).merge(
  z.object({
    q: z.string().optional(),
    id: z.union([z.string(), z.array(z.string())]).optional(),
    status: z.union([z.string(), z.array(z.string())]).optional(),
    collection_id: z.union([z.string(), z.array(z.string())]).optional(),
    sales_channel_id: z.union([z.string(), z.array(z.string())]).optional(),
    type_id: z.union([z.string(), z.array(z.string())]).optional(),
    tag_id: z.union([z.string(), z.array(z.string())]).optional(),
    created_at: createOperatorMap().optional(),
    updated_at: createOperatorMap().optional(),
  })
)

export type AdminCreateSellerType = z.infer<typeof CreateSeller> & AdditionalData
export const CreateSeller = z.object({
  name: z.string(),
  handle: z.string().optional(),
  email: z.string().email(),
  phone: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  logo: z.string().url().nullable().optional(),
  banner: z.string().url().nullable().optional(),
  website_url: z.string().nullable().optional(),
  external_id: z.string().nullable().optional(),
  currency_code: z.string(),
  status: z.string().optional(),
  status_reason: z.string().nullable().optional(),
  is_premium: z.boolean().optional(),
  closed_from: z.coerce.date().nullable().optional(),
  closed_to: z.coerce.date().nullable().optional(),
  closure_note: z.string().nullable().optional(),
  metadata: z.record(z.unknown()).nullable().optional(),
  member: z.object({
    email: z.string().email(),
  }),
})
export const AdminCreateSeller = WithAdditionalData(CreateSeller)

export type AdminUpdateSellerType = z.infer<typeof UpdateSeller> & AdditionalData
export const UpdateSeller = z.object({
  name: z.string().optional(),
  handle: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  logo: z.string().url().nullable().optional(),
  banner: z.string().url().nullable().optional(),
  website_url: z.string().nullable().optional(),
  external_id: z.string().nullable().optional(),
  status: z.string().optional(),
  status_reason: z.string().nullable().optional(),
  is_premium: z.boolean().optional(),
  closed_from: z.coerce.date().nullable().optional(),
  closed_to: z.coerce.date().nullable().optional(),
  closure_note: z.string().nullable().optional(),
  metadata: z.record(z.unknown()).nullable().optional(),
})
export const AdminUpdateSeller = WithAdditionalData(UpdateSeller)

export type AdminSuspendSellerType = z.infer<typeof AdminSuspendSeller>
export const AdminSuspendSeller = z.object({
  reason: z.string().optional(),
})

export type AdminTerminateSellerType = z.infer<typeof AdminTerminateSeller>
export const AdminTerminateSeller = z.object({
  reason: z.string().optional(),
})

export type AdminAddSellerMemberType = z.infer<typeof AdminAddSellerMember>
export const AdminAddSellerMember = z.object({
  member_id: z.string(),
  role_id: z.nativeEnum(SellerRole),
})

export type AdminInviteSellerMemberType = z.infer<
  typeof AdminInviteSellerMember
>
export const AdminInviteSellerMember = z.object({
  email: z.string().email(),
  role_id: z.nativeEnum(SellerRole),
})

export type AdminUpsertSellerAddressType = z.infer<typeof UpsertSellerAddress> & AdditionalData
export const UpsertSellerAddress = z.object({
  name: z.string().nullable().optional(),
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
export const AdminUpsertSellerAddress = WithAdditionalData(UpsertSellerAddress)

export type AdminUpsertSellerPaymentDetailsType = z.infer<typeof UpsertSellerPaymentDetails> & AdditionalData
export const UpsertSellerPaymentDetails = z.object({
  country_code: z.string().optional(),
  holder_name: z.string().optional(),
  bank_name: z.string().nullable().optional(),
  iban: z.string().nullable().optional(),
  bic: z.string().nullable().optional(),
  routing_number: z.string().nullable().optional(),
  account_number: z.string().nullable().optional(),
})
export const AdminUpsertSellerPaymentDetails = WithAdditionalData(UpsertSellerPaymentDetails)

export type AdminUpsertSellerProfessionalDetailsType = z.infer<typeof UpsertSellerProfessionalDetails> & AdditionalData
export const UpsertSellerProfessionalDetails = z.object({
  corporate_name: z.string().nullable().optional(),
  registration_number: z.string().nullable().optional(),
  tax_id: z.string().nullable().optional(),
})
export const AdminUpsertSellerProfessionalDetails = WithAdditionalData(UpsertSellerProfessionalDetails)

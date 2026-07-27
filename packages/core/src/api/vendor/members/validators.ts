import { z } from "zod"

import { WithAdditionalData } from "@medusajs/medusa/api/utils/validators"
import { AdditionalData } from "@medusajs/framework/types"

export type VendorAcceptMemberInviteType = z.infer<typeof VendorAcceptMemberInvite>
export const VendorAcceptMemberInvite = z.object({
  invite_token: z.string(),
  first_name: z.string().nullable().optional(),
  last_name: z.string().nullable().optional(),
})

export const UpdateMember = z.object({
  first_name: z.string().nullable().optional(),
  last_name: z.string().nullable().optional(),
  locale: z.string().nullable().optional(),
})

export type VendorUpdateMemberType = z.infer<typeof UpdateMember> & AdditionalData
export const VendorUpdateMember = WithAdditionalData(UpdateMember)

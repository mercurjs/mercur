import { z } from "zod"

export type VendorAcceptMemberInviteType = z.infer<typeof VendorAcceptMemberInvite>
export const VendorAcceptMemberInvite = z.object({
  invite_token: z.string(),
  first_name: z.string().nullable().optional(),
  last_name: z.string().nullable().optional(),
})

export type VendorUpdateMemberType = z.infer<typeof VendorUpdateMember>
export const VendorUpdateMember = z.object({
  first_name: z.string().nullable().optional(),
  last_name: z.string().nullable().optional(),
  locale: z.string().nullable().optional(),
})

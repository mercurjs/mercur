import { z } from "zod"

import { createFindParams } from "@medusajs/medusa/api/utils/validators"

export type VendorGetMemberInviteParamsType = z.infer<
  typeof VendorGetMemberInviteParams
>
export const VendorGetMemberInviteParams = createFindParams({
  offset: 0,
  limit: 50,
})

export type VendorInviteMemberType = z.infer<typeof VendorInviteMember>
export const VendorInviteMember = z
  .object({
    email: z.string().email(),
    role: z.enum(["owner", "admin", "member"]),
  })
  .strict()

export type VendorAcceptMemberInviteType = z.infer<
  typeof VendorAcceptMemberInvite
>
export const VendorAcceptMemberInvite = z
  .object({
    token: z.string(),
    name: z.string(),
  })
  .strict()

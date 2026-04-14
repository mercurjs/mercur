import { z } from "zod"

export type VendorAcceptMemberInviteType = z.infer<typeof VendorAcceptMemberInvite>
export const VendorAcceptMemberInvite = z.object({
  invite_token: z.string(),
})

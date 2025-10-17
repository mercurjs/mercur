import { z } from 'zod'

import { createFindParams } from '@medusajs/medusa/api/utils/validators'

import { MemberRole } from '@mercurjs/framework'

export type VendorGetMemberInviteParamsType = z.infer<
  typeof VendorGetMemberInviteParams
>
export const VendorGetMemberInviteParams = createFindParams({
  offset: 0,
  limit: 50
})

/**
 * @schema VendorInviteMember
 * type: object
 * required:
 *   - email
 *   - role
 * properties:
 *   email:
 *     type: string
 *     format: email
 *     description: The email address of the member to invite.
 *   role:
 *     type: string
 *     enum: [owner, admin, member]
 *     description: The role to assign to the invited member.
 */
export type VendorInviteMemberType = z.infer<typeof VendorInviteMember>

export const VendorInviteMember = z
  .object({
    email: z.string().email(),
    role: z.nativeEnum(MemberRole)
  })
  .strict()

/**
 * @schema VendorAcceptMemberInvite
 * type: object
 * required:
 *   - name
 *   - token
 * properties:
 *   token:
 *     type: string
 *     description: The invitation token to accept.
 *   name:
 *     type: string
 *     description: The name of the member accepting the invite.
 */
export type VendorAcceptMemberInviteType = z.infer<
  typeof VendorAcceptMemberInvite
>
export const VendorAcceptMemberInvite = z
  .object({
    token: z.string(),
    name: z.string()
  })
  .strict()

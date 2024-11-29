import { createFindParams } from '@medusajs/medusa/api/utils/validators'
import { MemberRole } from '@mercurjs/types'
import { z } from 'zod'

/**
 * @schema VendorGetMemberInviteParams
 * type: object
 * properties:
 *   limit:
 *     type: number
 *     description: The number of items to return. Default 50.
 *   offset:
 *     type: number
 *     description: The number of items to skip before starting the response. Default 0.
 *   fields:
 *     type: string
 *     description: Comma-separated fields that should be included in the returned data.
 *   expand:
 *     type: string
 *     description: Comma-separated relations that should be expanded in the returned data.
 *   order:
 *     type: string
 *     description: Field used to order the results.
 */
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
export type VendorInviteMemberType = WithRequired<
  z.infer<typeof VendorInviteMember>,
  'email' | 'role'
>
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
export type VendorAcceptMemberInviteType = WithRequired<
  z.infer<typeof VendorAcceptMemberInvite>,
  'name' | 'token'
>
export const VendorAcceptMemberInvite = z
  .object({
    token: z.string(),
    name: z.string()
  })
  .strict()

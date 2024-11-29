import { createFindParams } from '@medusajs/medusa/api/utils/validators'
import { z } from 'zod'

/**
 * @schema VendorGetMemberParams
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

export type VendorGetMemberParamsType = z.infer<typeof VendorGetMemberParams>
export const VendorGetMemberParams = createFindParams({
  offset: 0,
  limit: 50
})

/**
 * @schema VendorUpdateMember
 * type: object
 * properties:
 *   name:
 *     type: string
 *     description: The name of the member.
 *   bio:
 *     type: string
 *     nullable: true
 *     description: The member's biography.
 *   phone:
 *     type: string
 *     nullable: true
 *     description: The member's phone number.
 *   photo:
 *     type: string
 *     nullable: true
 *     description: URL to the member's photo.
 */
export type VendorUpdateMemberType = z.infer<typeof VendorUpdateMember>
export const VendorUpdateMember = z
  .object({
    name: z.string().optional(),
    bio: z.string().nullish().optional(),
    phone: z.string().nullish().optional(),
    photo: z.string().nullish().optional()
  })
  .strict()

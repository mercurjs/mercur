import { z } from 'zod'

import { createSelectParams } from '@medusajs/medusa/api/utils/validators'

export type VendorGetSellerParamsType = z.infer<typeof VendorGetSellerParams>
export const VendorGetSellerParams = createSelectParams()

/**
 * @schema VendorCreateSeller
 * type: object
 * required:
 *   - name
 *   - handle
 *   - member
 * properties:
 *   name:
 *     type: string
 *     description: The name of the seller.
 *     minLength: 1
 *   description:
 *     type: string
 *     nullable: true
 *     description: A description of the seller.
 *   photo:
 *     type: string
 *     nullable: true
 *     description: URL to the seller's photo.
 *   member:
 *     type: object
 *     required:
 *       - name
 *       - email
 *     properties:
 *       name:
 *         type: string
 *         description: The name of the member.
 *       bio:
 *         type: string
 *         nullable: true
 *         description: The member's biography.
 *       phone:
 *         type: string
 *         nullable: true
 *         description: The member's phone number.
 *       photo:
 *         type: string
 *         nullable: true
 *         description: URL to the member's photo.
 */

export type VendorCreateSellerType = z.infer<typeof VendorCreateSeller>
export const VendorCreateSeller = z
  .object({
    name: z.preprocess((val: string) => val?.trim(), z.string().min(1)),
    description: z.string().nullish().optional(),
    photo: z.string().nullish().optional(),
    member: z.object({
      name: z.string(),
      bio: z.string().nullish().optional(),
      phone: z.string().nullish().optional(),
      photo: z.string().nullish().optional()
    })
  })
  .strict()

/**
 * @schema VendorUpdateSeller
 * title: "Update Seller"
 * description: "A schema for the update seller request body."
 * x-resourceId: VendorUpdateSeller
 * type: object
 * properties:
 *   name:
 *     type: string
 *     description: The name of the seller.
 *     minLength: 4
 *   description:
 *     type: string
 *     nullable: true
 *     description: A description of the seller.
 *   photo:
 *     type: string
 *     nullable: true
 *     description: URL to the seller's photo.
 */
export type VendorUpdateSellerType = z.infer<typeof VendorUpdateSeller>
export const VendorUpdateSeller = z
  .object({
    name: z
      .preprocess((val: string) => val.trim(), z.string().min(4))
      .optional(),
    description: z.string().nullish().optional(),
    photo: z.string().nullish().optional()
  })
  .strict()

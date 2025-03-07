import { z } from 'zod'

import {
  createFindParams,
  createSelectParams
} from '@medusajs/medusa/api/utils/validators'

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
 *   email:
 *     type: string
 *     description: Store contact email.
 *   phone:
 *     type: string
 *     description: Store contact phone.
 *   photo:
 *     type: string
 *     nullable: true
 *     description: URL to the seller's photo.
 *   address_line:
 *     type: string
 *     nullable: true
 *     description: Seller address line.
 *   postal_code:
 *     type: string
 *     nullable: true
 *     description: Seller postal code.
 *   city:
 *     type: string
 *     nullable: true
 *     description: Seller city.
 *   state:
 *     type: string
 *     nullable: true
 *     description: Seller state.
 *   country_code:
 *     type: string
 *     nullable: true
 *     description: Seller country code.
 *   tax_id:
 *     type: string
 *     nullable: true
 *     description: Seller tax id.
 *   member:
 *     type: object
 *     required:
 *       - name
 *       - email
 *     properties:
 *       name:
 *         type: string
 *         description: The name of the member.
 *       email:
 *         type: string
 *         description: The email of the member.
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
    email: z.string().email().nullish(),
    phone: z.string().nullish(),
    address_line: z.string().nullish().optional(),
    city: z.string().nullish().optional(),
    state: z.string().nullish().optional(),
    postal_code: z.string().nullish().optional(),
    country_code: z.string().nullish().optional(),
    tax_id: z.string().nullish().optional(),
    member: z.object({
      name: z.string(),
      email: z.string().email(),
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
 *   email:
 *     type: string
 *     description: Store contact email.
 *   phone:
 *     type: string
 *     description: Store contact phone.
 *   address_line:
 *     type: string
 *     nullable: true
 *     description: Seller address line.
 *   postal_code:
 *     type: string
 *     nullable: true
 *     description: Seller postal code.
 *   city:
 *     type: string
 *     nullable: true
 *     description: Seller city.
 *   state:
 *     type: string
 *     nullable: true
 *     description: Seller state.
 *   country_code:
 *     type: string
 *     nullable: true
 *     description: Seller country code.
 *   tax_id:
 *     type: string
 *     nullable: true
 *     description: Seller tax id.
 */
export type VendorUpdateSellerType = z.infer<typeof VendorUpdateSeller>
export const VendorUpdateSeller = z
  .object({
    name: z
      .preprocess((val: string) => val.trim(), z.string().min(4))
      .optional(),
    description: z.string().nullish().optional(),
    photo: z.string().nullish().optional(),
    email: z.string().email().nullish().optional(),
    phone: z.string().nullish().optional(),
    address_line: z.string().nullish().optional(),
    city: z.string().nullish().optional(),
    state: z.string().nullish().optional(),
    postal_code: z.string().nullish().optional(),
    country_code: z.string().nullish().optional(),
    tax_id: z.string().nullish().optional()
  })
  .strict()

export type VendorGetReviewsParamsType = z.infer<typeof VendorGetReviewsParams>
export const VendorGetReviewsParams = createFindParams({
  offset: 0,
  limit: 50
})

/**
 * @schema VendorUpdateReview
 * title: "Update Review"
 * description: "A schema for the review update."
 * x-resourceId: VendorUpdateReview
 * type: object
 * properties:
 *   seller_note:
 *     type: string
 *     description: The seller response to a review.
 *     maxLength: 300
 */
export type VendorUpdateReviewType = z.infer<typeof VendorUpdateReview>
export const VendorUpdateReview = z.object({
  seller_note: z.string().max(300)
})

export type VendorGetOnboardingParamsType = z.infer<
  typeof VendorGetOnboardingParams
>
export const VendorGetOnboardingParams = createSelectParams()

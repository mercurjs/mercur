import { z } from 'zod'

import { createFindParams } from '@medusajs/medusa/api/utils/validators'

export type VendorGetShippingProfilesParamsType = z.infer<
  typeof VendorGetShippingProfilesParams
>
export const VendorGetShippingProfilesParams = createFindParams({
  limit: 20,
  offset: 0
})

/**
 * @schema VendorCreateShippingProfile
 * type: object
 * required:
 *   - name
 *   - type
 * properties:
 *   name:
 *     type: string
 *     description: Name of the shipping profile
 *   type:
 *     type: string
 *     description: Type of the shipping profile
 *   metadata:
 *     type: object
 *     nullable: true
 *     description: Additional metadata
 */
export type VendorCreateShippingProfileType = z.infer<
  typeof VendorCreateShippingProfile
>
export const VendorCreateShippingProfile = z
  .object({
    name: z.string(),
    type: z.string(),
    metadata: z.record(z.unknown()).nullish()
  })
  .strict()

/**
 * @schema VendorUpdateShippingProfile
 * type: object
 * properties:
 *   name:
 *     type: string
 *     description: Name of the shipping profile
 *   type:
 *     type: string
 *     description: Type of the shipping profile
 *   metadata:
 *     type: object
 *     nullable: true
 *     description: Additional metadata
 */
export type VendorUpdateShippingProfileType = z.infer<
  typeof VendorUpdateShippingProfile
>
export const VendorUpdateShippingProfile = z
  .object({
    name: z.string().optional(),
    type: z.string().optional(),
    metadata: z.record(z.unknown()).nullish()
  })
  .strict()

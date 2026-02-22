import { z } from 'zod'

import { createFindParams } from '@medusajs/medusa/api/utils/validators'

import { dateFilterSchema } from '../../../shared/infra/http/utils/zod'

export type VendorGetShippingProfilesParamsType = z.infer<
  typeof VendorGetShippingProfilesParams
>
export const VendorGetShippingProfilesParams = createFindParams({
  limit: 20,
  offset: 0
}).merge(
  z.object({
    q: z.string().optional(),
    id: z.union([z.string(), z.array(z.string())]).optional(),
    name: z.union([z.string(), z.array(z.string())]).optional(),
    type: z.union([z.string(), z.array(z.string())]).optional(),
    created_at: dateFilterSchema,
    updated_at: dateFilterSchema
  })
)

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

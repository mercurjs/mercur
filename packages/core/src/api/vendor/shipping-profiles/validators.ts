import { z } from "zod"
import {
  createFindParams,
  createOperatorMap,
  createSelectParams,
} from "@medusajs/medusa/api/utils/validators"

export type VendorGetShippingProfileParamsType = z.infer<
  typeof VendorGetShippingProfileParams
>
export const VendorGetShippingProfileParams = createSelectParams()

export type VendorGetShippingProfilesParamsType = z.infer<
  typeof VendorGetShippingProfilesParams
>
export const VendorGetShippingProfilesParams = createFindParams({
  limit: 20,
  offset: 0,
}).merge(
  z.object({
    id: z.union([z.string(), z.array(z.string())]).optional(),
    q: z.string().optional(),
    type: z.string().optional(),
    name: z.string().optional(),
    created_at: createOperatorMap().optional(),
    updated_at: createOperatorMap().optional(),
  })
)

export type VendorCreateShippingProfileType = z.infer<
  typeof VendorCreateShippingProfile
>
export const VendorCreateShippingProfile = z
  .object({
    name: z.string(),
    type: z.string(),
    metadata: z.record(z.unknown()).nullish(),
  })
  .strict()

export type VendorUpdateShippingProfileType = z.infer<
  typeof VendorUpdateShippingProfile
>
export const VendorUpdateShippingProfile = z
  .object({
    name: z.string().optional(),
    type: z.string().optional(),
    metadata: z.record(z.unknown()).nullish(),
  })
  .strict()

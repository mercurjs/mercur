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

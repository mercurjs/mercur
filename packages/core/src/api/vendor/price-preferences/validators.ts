import { z } from "zod"
import {
  createFindParams,
  createSelectParams,
} from "@medusajs/medusa/api/utils/validators"

export type VendorGetPricePreferenceParamsType = z.infer<
  typeof VendorGetPricePreferenceParams
>
export const VendorGetPricePreferenceParams = createSelectParams()

export type VendorGetPricePreferencesParamsType = z.infer<
  typeof VendorGetPricePreferencesParams
>
export const VendorGetPricePreferencesParams = createFindParams({
  offset: 0,
  limit: 10,
}).merge(
  z.object({
    q: z.string().optional(),
    id: z.union([z.string(), z.array(z.string())]).optional(),
    attribute: z.union([z.string(), z.array(z.string())]).optional(),
    value: z.union([z.string(), z.array(z.string())]).optional(),
  })
)

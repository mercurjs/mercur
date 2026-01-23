import { z } from "zod"
import {
  createFindParams,
  createOperatorMap,
  createSelectParams,
} from "@medusajs/medusa/api/utils/validators"

export type VendorGetShippingOptionTypeParamsType = z.infer<
  typeof VendorGetShippingOptionTypeParams
>
export const VendorGetShippingOptionTypeParams = createSelectParams()

export type VendorGetShippingOptionTypesParamsType = z.infer<
  typeof VendorGetShippingOptionTypesParams
>
export const VendorGetShippingOptionTypesParams = createFindParams({
  limit: 20,
  offset: 0,
}).merge(
  z.object({
    q: z.string().optional(),
    id: z.union([z.string(), z.array(z.string())]).optional(),
    label: z.union([z.string(), z.array(z.string())]).optional(),
    code: z.union([z.string(), z.array(z.string())]).optional(),
    description: z.union([z.string(), z.array(z.string())]).optional(),
    created_at: createOperatorMap().optional(),
    updated_at: createOperatorMap().optional(),
  })
)

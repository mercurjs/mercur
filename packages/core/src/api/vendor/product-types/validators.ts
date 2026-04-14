import { z } from "zod"
import {
  createFindParams,
  createSelectParams,
} from "@medusajs/medusa/api/utils/validators"

export type VendorGetProductTypeParamsType = z.infer<
  typeof VendorGetProductTypeParams
>
export const VendorGetProductTypeParams = createSelectParams()

export type VendorGetProductTypesParamsType = z.infer<
  typeof VendorGetProductTypesParams
>
export const VendorGetProductTypesParams = createFindParams({
  offset: 0,
  limit: 50,
}).merge(
  z.object({
    q: z.string().optional(),
    id: z.union([z.string(), z.array(z.string())]).optional(),
    value: z.union([z.string(), z.array(z.string())]).optional(),
  })
)

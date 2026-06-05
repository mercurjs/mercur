import { z } from "zod"
import {
  createFindParams,
  createSelectParams,
} from "@medusajs/medusa/api/utils/validators"

export type VendorGetStoreParamsType = z.infer<typeof VendorGetStoreParams>
export const VendorGetStoreParams = createSelectParams()

export type VendorGetStoresParamsType = z.infer<typeof VendorGetStoresParams>
export const VendorGetStoresParams = createFindParams({
  offset: 0,
  limit: 50,
}).merge(
  z.object({
    q: z.string().optional(),
    id: z.union([z.string(), z.array(z.string())]).optional(),
    name: z.union([z.string(), z.array(z.string())]).optional(),
  })
)

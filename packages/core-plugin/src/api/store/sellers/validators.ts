import { z } from "zod"
import {
  createFindParams,
  createOperatorMap,
  createSelectParams,
} from "@medusajs/medusa/api/utils/validators"

export type StoreGetSellersParamsType = z.infer<typeof StoreGetSellersParams>
export const StoreGetSellersParams = createFindParams({
  offset: 0,
  limit: 50,
}).merge(
  z.object({
    q: z.string().optional(),
    id: z.union([z.string(), z.array(z.string())]).optional(),
    name: z.union([z.string(), z.array(z.string())]).optional(),
    handle: z.string().optional(),
    is_premium: z.boolean().optional(),
    created_at: createOperatorMap().optional(),
    updated_at: createOperatorMap().optional(),
  })
)

export type StoreGetSellerParamsType = z.infer<typeof StoreGetSellerParams>
export const StoreGetSellerParams = createSelectParams()

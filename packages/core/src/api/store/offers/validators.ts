import { z } from "zod"
import {
  createFindParams,
  createOperatorMap,
  createSelectParams,
} from "@medusajs/medusa/api/utils/validators"

const StoreOfferContextFields = z.object({
  region_id: z.string().optional(),
  country_code: z.string().optional(),
  province: z.string().optional(),
  cart_id: z.string().optional(),
})

const StoreOfferFilterFields = z.object({
  q: z.string().optional(),
  id: z.union([z.string(), z.array(z.string())]).optional(),
  product_id: z.union([z.string(), z.array(z.string())]).optional(),
  variant_id: z.union([z.string(), z.array(z.string())]).optional(),
  seller_id: z.union([z.string(), z.array(z.string())]).optional(),
  sku: z.union([z.string(), z.array(z.string())]).optional(),
  created_at: createOperatorMap().optional(),
  updated_at: createOperatorMap().optional(),
})

export type StoreGetOfferParamsType = z.infer<typeof StoreGetOfferParams>
export const StoreGetOfferParams =
  createSelectParams().merge(StoreOfferContextFields)

export type StoreGetOffersParamsType = z.infer<typeof StoreGetOffersParams>
export const StoreGetOffersParams = createFindParams({
  offset: 0,
  limit: 50,
})
  .merge(StoreOfferContextFields)
  .merge(StoreOfferFilterFields)

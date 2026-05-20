import { z } from "zod"
import {
  createFindParams,
  createOperatorMap,
  createSelectParams,
} from "@medusajs/medusa/api/utils/validators"

export type AdminGetOfferParamsType = z.infer<typeof AdminGetOfferParams>
export const AdminGetOfferParams = createSelectParams()

export type AdminGetOffersParamsType = z.infer<typeof AdminGetOffersParams>
export const AdminGetOffersParams = createFindParams({
  offset: 0,
  limit: 50,
}).merge(
  z.object({
    q: z.string().optional(),
    id: z.union([z.string(), z.array(z.string())]).optional(),
    seller_id: z.union([z.string(), z.array(z.string())]).optional(),
    variant_id: z.union([z.string(), z.array(z.string())]).optional(),
    shipping_profile_id: z
      .union([z.string(), z.array(z.string())])
      .optional(),
    sku: z.union([z.string(), z.array(z.string())]).optional(),
    ean: z.union([z.string(), z.array(z.string())]).optional(),
    upc: z.union([z.string(), z.array(z.string())]).optional(),
    created_at: createOperatorMap().optional(),
    updated_at: createOperatorMap().optional(),
  })
)

import { z } from "zod"
import {
  createFindParams,
  createOperatorMap,
  createSelectParams,
} from "@medusajs/medusa/api/utils/validators"
import { SellerStatus } from "@mercurjs/types"

export type AdminGetSellerParamsType = z.infer<typeof AdminGetSellerParams>
export const AdminGetSellerParams = createSelectParams()

export const AdminUpdateSeller = z.object({
  name: z.preprocess((val: string) => val?.trim(), z.string().min(1)).optional(),
  handle: z.preprocess((val: string) => val?.trim(), z.string().min(1)).optional(),
  email: z.string().email().optional(),
  phone: z.string().nullish(),
  logo: z.string().nullish(),
  cover_image: z.string().nullish(),
  address_1: z.string().nullish(),
  address_2: z.string().nullish(),
  city: z.string().nullish(),
  country_code: z.string().nullish(),
  province: z.string().nullish(),
  postal_code: z.string().nullish(),
  status: z.nativeEnum(SellerStatus).optional(),
}).strict()
export type AdminUpdateSellerType = z.infer<typeof AdminUpdateSeller>

export type AdminGetSellersParamsType = z.infer<typeof AdminGetSellersParams>
export const AdminGetSellersParams = createFindParams({
  offset: 0,
  limit: 50,
}).merge(
  z.object({
    q: z.string().optional(),
    id: z.union([z.string(), z.array(z.string())]).optional(),
    name: z.union([z.string(), z.array(z.string())]).optional(),
    handle: z.union([z.string(), z.array(z.string())]).optional(),
    email: z.union([z.string(), z.array(z.string())]).optional(),
    status: z.union([z.string(), z.array(z.string())]).optional(),
    created_at: createOperatorMap().optional(),
    updated_at: createOperatorMap().optional(),
  })
)

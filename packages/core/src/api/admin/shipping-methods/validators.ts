import { z } from "zod"
import {
  createFindParams,
  createSelectParams,
} from "@medusajs/medusa/api/utils/validators"
import { booleanString } from "@medusajs/medusa/api/utils/common-validators/common"

export type AdminGetShippingMethodParamsType = z.infer<
  typeof AdminGetShippingMethodParams
>
export const AdminGetShippingMethodParams = createSelectParams()

export type AdminGetShippingMethodsParamsType = z.infer<
  typeof AdminGetShippingMethodsParams
>
export const AdminGetShippingMethodsParams = createFindParams({
  offset: 0,
  limit: 50,
  order: "name",
}).merge(
  z.object({
    q: z.string().optional(),
    id: z.union([z.string(), z.array(z.string())]).optional(),
    code: z.union([z.string(), z.array(z.string())]).optional(),
    provider_id: z.union([z.string(), z.array(z.string())]).optional(),
    is_active: booleanString().optional(),
  })
)

export type AdminCreateShippingMethodType = z.infer<
  typeof AdminCreateShippingMethod
>
export const AdminCreateShippingMethod = z
  .object({
    name: z.string().min(1),
    code: z.string().min(1),
    description: z.string().nullish(),
    provider_id: z.string().min(1),
    shipping_option_type_id: z.string().min(1),
    is_active: z.boolean().optional(),
    metadata: z.record(z.string(), z.unknown()).nullish(),
  })
  .strict()

export type AdminUpdateShippingMethodType = z.infer<
  typeof AdminUpdateShippingMethod
>
export const AdminUpdateShippingMethod = z
  .object({
    name: z.string().min(1).optional(),
    description: z.string().nullish(),
    is_active: z.boolean().optional(),
    metadata: z.record(z.string(), z.unknown()).nullish(),
  })
  .strict()

import { z } from "zod"
import {
  createFindParams,
  createOperatorMap,
  createSelectParams,
} from "@medusajs/medusa/api/utils/validators"

export type AdminGetOrderGroupParamsType = z.infer<typeof AdminGetOrderGroupParams>
export const AdminGetOrderGroupParams = createSelectParams()

export type AdminGetOrderGroupsParamsType = z.infer<typeof AdminGetOrderGroupsParams>
export const AdminGetOrderGroupsParams = createFindParams({
  offset: 0,
  limit: 50,
}).merge(
  z.object({
    q: z.string().optional(),
    id: z.union([z.string(), z.array(z.string())]).optional(),
    customer_id: z.union([z.string(), z.array(z.string())]).optional(),
    seller_id: z.union([z.string(), z.array(z.string())]).optional(),
    status: z.union([z.string(), z.array(z.string())]).optional(),
    sales_channel_id: z.union([z.string(), z.array(z.string())]).optional(),
    created_at: createOperatorMap().optional(),
    updated_at: createOperatorMap().optional(),
    // Mercur extension consumed by `applyRequestFilter` — filters order
    // groups by whether any child order has an open edit / return /
    // exchange / claim. Declared as a permissive string|array on the
    // schema so the validator doesn't reject the raw query; the
    // middleware does enum parsing via `parseRequestParam`.
    request: z.union([z.string(), z.array(z.string())]).optional(),
  })
)

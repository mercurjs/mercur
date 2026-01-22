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
  })
)

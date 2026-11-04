import { z } from "zod"
import {
  createFindParams,
  createOperatorMap,
  createSelectParams,
} from "@medusajs/medusa/api/utils/validators"

const MAX_LIMIT = 1000

export type AdminGetOrderGroupParamsType = z.infer<typeof AdminGetOrderGroupParams>
export const AdminGetOrderGroupParams = createSelectParams()

export type AdminGetOrderGroupsParamsType = z.infer<typeof AdminGetOrderGroupsParams>
export const AdminGetOrderGroupsParams = createFindParams({
  offset: 0,
  limit: 50,
}).merge(
  z.object({
    limit: z.preprocess(
      (val) => (typeof val === "string" ? parseInt(val, 10) : val),
      z.number().int().min(1).max(MAX_LIMIT).optional().default(50)
    ),
    q: z.string().optional(),
    id: z.union([z.string(), z.array(z.string())]).optional(),
    customer_id: z.union([z.string(), z.array(z.string())]).optional(),
    seller_id: z.union([z.string(), z.array(z.string())]).optional(),
    status: z.union([z.string(), z.array(z.string())]).optional(),
    payment_status: z.union([z.string(), z.array(z.string())]).optional(),
    sales_channel_id: z.union([z.string(), z.array(z.string())]).optional(),
    created_at: createOperatorMap().optional(),
    updated_at: createOperatorMap().optional(),
  })
)

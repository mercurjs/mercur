import { z } from "zod"
import { createFindParams, createOperatorMap } from "@medusajs/medusa/api/utils/validators"

const AdminGetOrdersParamsBase = createFindParams({
  limit: 15,
  offset: 0,
}).merge(
  z.object({
    id: z
      .union([z.string(), z.array(z.string()), createOperatorMap()])
      .optional(),
    status: z
      .union([z.string(), z.array(z.string()), createOperatorMap()])
      .optional(),
    name: z.union([z.string(), z.array(z.string())]).optional(),
    sales_channel_id: z.array(z.string()).optional(),
    region_id: z.union([z.string(), z.array(z.string())]).optional(),
    customer_id: z.union([z.string(), z.array(z.string())]).optional(),
    q: z.string().optional(),
    created_at: createOperatorMap().optional(),
    updated_at: createOperatorMap().optional(),
    total: createOperatorMap().optional(),
    seller_id: z.union([z.string(), z.array(z.string())]).optional(),
  })
)

type AdminGetOrdersParamsInput = z.infer<typeof AdminGetOrdersParamsBase>

const AdminGetOrdersParamsTransform = (v: AdminGetOrdersParamsInput) => {
  const { total, ...rest } = v
  return {
    ...rest,
    ...(total ? { summary: { totals: { current_order_total: total } } } : {}),
  }
}

export const AdminGetOrdersParams = AdminGetOrdersParamsBase.transform(
  AdminGetOrdersParamsTransform
)

export type AdminGetOrdersParamsType = z.infer<typeof AdminGetOrdersParams>

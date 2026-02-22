import { z } from "zod";

import {
  createFindParams,
  createOperatorMap,
} from "@medusajs/medusa/api/utils/validators";

export type AdminOrderSetParamsType = z.infer<typeof AdminOrderSetParams>;
export const AdminOrderSetParams = createFindParams({
  offset: 0,
  limit: 50,
}).merge(
  z.object({
    order_id: z.string().optional(),
    seller_id: z.union([z.string(), z.array(z.string())]).optional(),
    payment_status: z.union([z.string(), z.array(z.string())]).optional(),
    fulfillment_status: z.union([z.string(), z.array(z.string())]).optional(),
    sales_channel_id: z.union([z.string(), z.array(z.string())]).optional(),
    created_at: createOperatorMap().optional(),
    updated_at: createOperatorMap().optional(),
    q: z.string().optional(),
  })
);

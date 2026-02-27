import { z } from "zod"
import { AdminGetOrdersParams as BaseAdminGetOrdersParams } from "@medusajs/medusa/api/admin/orders/validators"

export const AdminGetOrdersParams = BaseAdminGetOrdersParams.extend({
  seller_id: z.union([z.string(), z.array(z.string())]).optional(),
})

export type AdminGetOrdersParamsType = z.infer<typeof AdminGetOrdersParams>

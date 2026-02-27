import { z } from "zod"
import { AdminGetProductsParams as BaseAdminGetProductsParams } from "@medusajs/medusa/api/admin/products/validators"

export const AdminGetProductsParams = BaseAdminGetProductsParams._def.schema.extend({
  seller_id: z.string().optional(),
})

export type AdminGetProductsParamsType = z.infer<typeof AdminGetProductsParams>
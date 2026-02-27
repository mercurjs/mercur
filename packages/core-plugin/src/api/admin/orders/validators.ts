import { z } from "zod"
import { createFindParams } from "@medusajs/medusa/api/utils/validators"
import { AdminGetProductsParamsDirectFields } from "@medusajs/medusa/api/admin/products/validators"
import { applyAndAndOrOperators } from "@medusajs/medusa/api/utils/common-validators/common"
import { GetProductsParams } from "@medusajs/medusa/api/utils/common-validators/index"

export const AdminGetOrdersParams = createFindParams({
  offset: 0,
  limit: 50,
})
  .merge(AdminGetProductsParamsDirectFields)
  .merge(
    z
      .object({
        price_list_id: z.string().array().optional(),
      })
      .merge(applyAndAndOrOperators(AdminGetProductsParamsDirectFields))
      .merge(GetProductsParams)
      .merge(z.object({
        seller_id: z.union([z.string(), z.array(z.string())]).optional(),
      }))
  )

export type AdminGetOrdersParamsType = z.infer<typeof AdminGetOrdersParams>

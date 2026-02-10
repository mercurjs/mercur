import { MiddlewareRoute } from "@medusajs/framework/http"
import { validateAndTransformQuery } from "@medusajs/framework"

import { adminSellerQueryConfig } from "./query-config"
import { AdminGetSellerParams, AdminGetSellersParams } from "./validators"

export const adminSellersMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/sellers",
    middlewares: [
      validateAndTransformQuery(
        AdminGetSellersParams,
        adminSellerQueryConfig.list
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/sellers/:id",
    middlewares: [
      validateAndTransformQuery(
        AdminGetSellerParams,
        adminSellerQueryConfig.retrieve
      ),
    ],
  },
]

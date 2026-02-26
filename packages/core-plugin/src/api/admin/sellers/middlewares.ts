import { MiddlewareRoute } from "@medusajs/framework/http"
import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"

import { adminSellerQueryConfig } from "./query-config"
import {
  AdminGetSellerParams,
  AdminGetSellersParams,
  AdminUpdateSeller,
} from "./validators"

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
  {
    method: ["POST"],
    matcher: "/admin/sellers/:id",
    middlewares: [
      validateAndTransformBody(AdminUpdateSeller),
      validateAndTransformQuery(
        AdminGetSellerParams,
        adminSellerQueryConfig.retrieve
      ),
    ],
  },
]

import { MiddlewareRoute } from "@medusajs/framework/http"
import { validateAndTransformQuery } from "@medusajs/framework"

import { adminOfferQueryConfig } from "./query-config"
import { AdminGetOfferParams, AdminGetOffersParams } from "./validators"

export const adminOffersMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/offers",
    middlewares: [
      validateAndTransformQuery(
        AdminGetOffersParams,
        adminOfferQueryConfig.list
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/offers/:id",
    middlewares: [
      validateAndTransformQuery(
        AdminGetOfferParams,
        adminOfferQueryConfig.retrieve
      ),
    ],
  },
]

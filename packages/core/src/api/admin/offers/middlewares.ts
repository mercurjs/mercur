import { MiddlewareRoute } from "@medusajs/framework/http"
import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"

import { adminOfferQueryConfig } from "./query-config"
import {
  AdminCreateOffersBatch,
  AdminGetOfferParams,
  AdminGetOffersParams,
} from "./validators"

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
    method: ["POST"],
    matcher: "/admin/offers/batch",
    middlewares: [
      validateAndTransformBody(AdminCreateOffersBatch),
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

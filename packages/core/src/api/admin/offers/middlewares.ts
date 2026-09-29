import { requirePermission } from "../../utils"
import { MiddlewareRoute } from "@medusajs/framework/http"
import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"

import { applyGroupedOfferProductFilter } from "../../utils"
import { adminOfferQueryConfig } from "./query-config"
import {
  AdminCreateOffersBatch,
  AdminGetOfferParams,
  AdminGetOffersParams,
} from "./validators"

export const adminOffersMiddlewares: MiddlewareRoute[] = [
  {
    method: ["DELETE"],
    matcher: "/admin/offers/:id",
    middlewares: [requirePermission("offers", "manage")],
  },
  {
    method: ["GET"],
    matcher: "/admin/offers",
    middlewares: [
      requirePermission("offers", "view"),
      validateAndTransformQuery(
        AdminGetOffersParams,
        adminOfferQueryConfig.list
      ),
      applyGroupedOfferProductFilter,
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/offers/batch",
    middlewares: [
      requirePermission("offers", "edit"),
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
      requirePermission("offers", "view"),
      validateAndTransformQuery(
        AdminGetOfferParams,
        adminOfferQueryConfig.retrieve
      ),
    ],
  },
]

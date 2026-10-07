import { MiddlewareRoute } from "@medusajs/framework/http"
import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"

import { requirePermission } from "../../utils"
import { adminOfferConditionQueryConfig } from "./query-config"
import {
  AdminCreateOfferCondition,
  AdminGetOfferConditionParams,
  AdminGetOfferConditionsParams,
  AdminUpdateOfferCondition,
} from "./validators"

export const adminOfferConditionsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/offer-conditions",
    middlewares: [
      requirePermission("offers", "view"),
      validateAndTransformQuery(
        AdminGetOfferConditionsParams,
        adminOfferConditionQueryConfig.list
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/offer-conditions",
    middlewares: [
      requirePermission("offers", "manage"),
      validateAndTransformBody(AdminCreateOfferCondition),
      validateAndTransformQuery(
        AdminGetOfferConditionParams,
        adminOfferConditionQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/offer-conditions/:id",
    middlewares: [
      requirePermission("offers", "view"),
      validateAndTransformQuery(
        AdminGetOfferConditionParams,
        adminOfferConditionQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/offer-conditions/:id",
    middlewares: [
      requirePermission("offers", "manage"),
      validateAndTransformBody(AdminUpdateOfferCondition),
      validateAndTransformQuery(
        AdminGetOfferConditionParams,
        adminOfferConditionQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/admin/offer-conditions/:id",
    middlewares: [requirePermission("offers", "manage")],
  },
]

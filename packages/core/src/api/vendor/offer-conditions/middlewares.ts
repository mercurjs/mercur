import {
  AuthenticatedMedusaRequest,
  MedusaNextFunction,
  MedusaResponse,
  MiddlewareRoute,
} from "@medusajs/framework/http"
import { validateAndTransformQuery } from "@medusajs/framework"

import { requirePermission } from "../../utils"
import { vendorOfferConditionQueryConfig } from "./query-config"
import {
  VendorGetOfferConditionParams,
  VendorGetOfferConditionsParams,
} from "./validators"

const applyActiveConditionFilter = (
  req: AuthenticatedMedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) => {
  req.filterableFields.is_active = true
  next()
}

export const vendorOfferConditionsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/offer-conditions",
    middlewares: [
      requirePermission("offers", "view"),
      validateAndTransformQuery(
        VendorGetOfferConditionsParams,
        vendorOfferConditionQueryConfig.list
      ),
      applyActiveConditionFilter,
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/offer-conditions/:id",
    middlewares: [
      requirePermission("offers", "view"),
      validateAndTransformQuery(
        VendorGetOfferConditionParams,
        vendorOfferConditionQueryConfig.retrieve
      ),
    ],
  },
]

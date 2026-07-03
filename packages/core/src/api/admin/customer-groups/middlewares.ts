import {
  AuthenticatedMedusaRequest,
  maybeApplyLinkFilter,
  MedusaNextFunction,
  MedusaResponse,
  MiddlewareRoute,
} from "@medusajs/framework/http"
import { validateAndTransformQuery } from "@medusajs/framework"
import { listTransformQueryConfig } from "@medusajs/medusa/api/admin/customer-groups/query-config"

import { ORIGINAL_MIDDLEWARES } from "../../../utils/disable-medusa-middlewares"
import { AdminGetCustomerGroupsParams } from "./validators"

const LIST_MATCHER = "/admin/customer-groups"

const capturedBase = (ORIGINAL_MIDDLEWARES[
  "dist/api/admin/customer-groups/middlewares.js"
] ?? []) as MiddlewareRoute[]

const baseWithoutListGet = capturedBase.filter((route) => {
  if (route.matcher !== LIST_MATCHER) {
    return true
  }
  const methods = Array.isArray(route.method)
    ? route.method
    : route.method
    ? [route.method]
    : []
  return !methods.includes("GET")
})

const maybeApplyCustomerGroupSellerFilter = (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  if (!req.filterableFields.seller_id) {
    return next()
  }

  return maybeApplyLinkFilter({
    entryPoint: "customer_group_seller",
    resourceId: "customer_group_id",
    filterableField: "seller_id",
  })(req, res, next)
}

export const adminCustomerGroupsMiddlewares: MiddlewareRoute[] = [
  ...baseWithoutListGet,
  {
    method: ["GET"],
    matcher: LIST_MATCHER,
    middlewares: [
      validateAndTransformQuery(
        AdminGetCustomerGroupsParams,
        listTransformQueryConfig
      ),
      maybeApplyCustomerGroupSellerFilter,
    ],
  },
]

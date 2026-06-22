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

// Re-spread every base middleware except the list GET, which we replace below
// so we can allow `seller_id` and translate it into a link filter.
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

// Customer groups are owned through the `customer_group_seller` link, so a
// `seller_id` filter can't hit the customer_group table directly — rewrite it
// into an `id IN (...)` filter sourced from the link.
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

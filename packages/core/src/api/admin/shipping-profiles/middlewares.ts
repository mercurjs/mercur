import { PolicyOperation } from "@medusajs/framework/utils"
import { PolicyResource } from "../../utils/policy-resources"
import { MiddlewareRoute } from "@medusajs/framework/http"
import { validateAndTransformQuery } from "@medusajs/framework"
import { AdminGetShippingProfilesParams } from "@medusajs/medusa/api/admin/shipping-profiles/validators"
import { listTransformQueryConfig } from "@medusajs/medusa/api/admin/shipping-profiles/query-config"

import { ORIGINAL_MIDDLEWARES } from "../../../utils/disable-medusa-middlewares"

const LIST_MATCHER = "/admin/shipping-profiles"

const capturedBase = (ORIGINAL_MIDDLEWARES[
  "dist/api/admin/shipping-profiles/middlewares.js"
] ?? []) as MiddlewareRoute[]

const baseWithoutListGet = capturedBase.filter((route) => {
  if (route.matcher !== LIST_MATCHER) return true
  const methods = Array.isArray(route.method)
    ? route.method
    : route.method
    ? [route.method]
    : []
  return !methods.includes("GET")
})

export const adminShippingProfilesMiddlewares: MiddlewareRoute[] = [
  ...baseWithoutListGet,
  {
    method: ["GET"],
    matcher: LIST_MATCHER,
    middlewares: [
      validateAndTransformQuery(
        AdminGetShippingProfilesParams,
        listTransformQueryConfig
      ),
    ],
    policies: [
      {
        resource: PolicyResource.shipping_profile,
        operation: PolicyOperation.read,
      },
    ],
  },
]

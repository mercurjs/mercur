import {
  AuthenticatedMedusaRequest,
  maybeApplyLinkFilter,
  MedusaNextFunction,
  MedusaResponse,
  MiddlewareRoute,
} from "@medusajs/framework/http"
import { validateAndTransformQuery } from "@medusajs/framework"
import { z } from "zod"
import { AdminGetShippingOptionsParams } from "@medusajs/medusa/api/admin/shipping-options/validators"
import { listTransformQueryConfig } from "@medusajs/medusa/api/admin/shipping-options/query-config"

import { ORIGINAL_MIDDLEWARES } from "../../../utils/disable-medusa-middlewares"

const LIST_MATCHER = "/admin/shipping-options"

const capturedBase = (ORIGINAL_MIDDLEWARES[
  "dist/api/admin/shipping-options/middlewares.js"
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

const AdminGetShippingOptionsParamsWithSeller =
  AdminGetShippingOptionsParams.merge(
    z.object({
      seller_id: z.union([z.string(), z.array(z.string())]).optional(),
    })
  )

const maybeApplySellerShippingOptionFilter = (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  if (!req.filterableFields.seller_id) {
    return next()
  }

  return maybeApplyLinkFilter({
    entryPoint: "shipping_option_seller",
    resourceId: "shipping_option_id",
    filterableField: "seller_id",
  })(req, res, next)
}

export const adminShippingOptionsMiddlewares: MiddlewareRoute[] = [
  ...baseWithoutListGet,
  {
    method: ["GET"],
    matcher: LIST_MATCHER,
    middlewares: [
      validateAndTransformQuery(
        AdminGetShippingOptionsParamsWithSeller,
        listTransformQueryConfig
      ),
      maybeApplySellerShippingOptionFilter,
    ],
  },
]

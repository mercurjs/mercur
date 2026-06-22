import {
  AuthenticatedMedusaRequest,
  maybeApplyLinkFilter,
  MedusaNextFunction,
  MedusaResponse,
  MiddlewareRoute,
} from "@medusajs/framework/http"
import { validateAndTransformQuery } from "@medusajs/framework"
import { z } from "zod"
import { AdminGetStockLocationsParams } from "@medusajs/medusa/api/admin/stock-locations/validators"
import { listTransformQueryConfig } from "@medusajs/medusa/api/admin/stock-locations/query-config"

import { ORIGINAL_MIDDLEWARES } from "../../../utils/disable-medusa-middlewares"

const LIST_MATCHER = "/admin/stock-locations"

const capturedBase = (ORIGINAL_MIDDLEWARES[
  "dist/api/admin/stock-locations/middlewares.js"
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

const AdminGetStockLocationsParamsWithSeller =
  AdminGetStockLocationsParams.merge(
    z.object({
      seller_id: z.union([z.string(), z.array(z.string())]).optional(),
    })
  )

const maybeApplySellerStockLocationFilter = (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  if (!req.filterableFields.seller_id) {
    return next()
  }

  return maybeApplyLinkFilter({
    entryPoint: "stock_location_seller",
    resourceId: "stock_location_id",
    filterableField: "seller_id",
  })(req, res, next)
}

export const adminStockLocationsMiddlewares: MiddlewareRoute[] = [
  ...baseWithoutListGet,
  {
    method: ["GET"],
    matcher: LIST_MATCHER,
    middlewares: [
      validateAndTransformQuery(
        AdminGetStockLocationsParamsWithSeller,
        listTransformQueryConfig
      ),
      maybeApplySellerStockLocationFilter,
    ],
  },
]

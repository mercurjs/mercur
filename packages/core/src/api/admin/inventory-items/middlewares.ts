import {
  AuthenticatedMedusaRequest,
  maybeApplyLinkFilter,
  MedusaNextFunction,
  MedusaResponse,
  MiddlewareRoute,
} from "@medusajs/framework/http"
import { validateAndTransformQuery } from "@medusajs/framework"
import { z } from "zod"
import { AdminGetInventoryItemsParams } from "@medusajs/medusa/api/admin/inventory-items/validators"
import { listTransformQueryConfig } from "@medusajs/medusa/api/admin/inventory-items/query-config"

import { ORIGINAL_MIDDLEWARES } from "../../../utils/disable-medusa-middlewares"

const LIST_MATCHER = "/admin/inventory-items"

const capturedBase = (ORIGINAL_MIDDLEWARES[
  "dist/api/admin/inventory-items/middlewares.js"
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

const AdminGetInventoryItemsParamsWithSeller =
  AdminGetInventoryItemsParams.merge(
    z.object({
      seller_id: z.union([z.string(), z.array(z.string())]).optional(),
    })
  )

const maybeApplySellerInventoryFilter = (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  if (!req.filterableFields.seller_id) {
    return next()
  }

  return maybeApplyLinkFilter({
    entryPoint: "inventory_item_seller",
    resourceId: "inventory_item_id",
    filterableField: "seller_id",
  })(req, res, next)
}

export const adminInventoryItemsMiddlewares: MiddlewareRoute[] = [
  ...baseWithoutListGet,
  {
    method: ["GET"],
    matcher: LIST_MATCHER,
    middlewares: [
      validateAndTransformQuery(
        AdminGetInventoryItemsParamsWithSeller,
        listTransformQueryConfig
      ),
      maybeApplySellerInventoryFilter,
    ],
  },
]

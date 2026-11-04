import { requirePermission } from "../../utils"
import { MiddlewareRoute } from "@medusajs/framework/http"
import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"

import { adminProductChangeQueryConfig } from "./query-config"
import {
  AdminCancelProductChange,
  AdminConfirmProductChange,
  AdminGetProductChangesParams,
} from "./validators"

export const adminProductChangesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/product-changes",
    middlewares: [
      requirePermission("product_changes", "view"),
      validateAndTransformQuery(
        AdminGetProductChangesParams,
        adminProductChangeQueryConfig.list
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/product-changes/:id/confirm",
    middlewares: [
      requirePermission("products.review", "edit"),
      validateAndTransformBody(AdminConfirmProductChange)],
  },
  {
    method: ["POST"],
    matcher: "/admin/product-changes/:id/cancel",
    middlewares: [
      requirePermission("products.review", "edit"),
      validateAndTransformBody(AdminCancelProductChange)],
  },
]

import { PolicyResource } from "../../utils/policy-resources"
import { PolicyOperation } from "@medusajs/framework/utils"
import { MiddlewareRoute } from "@medusajs/framework/http"
import { validateAndTransformBody } from "@medusajs/framework"

import {
  AdminCancelProductChange,
  AdminConfirmProductChange,
} from "./validators"

export const adminProductChangesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["POST"],
    matcher: "/admin/product-changes/:id/confirm",
    middlewares: [validateAndTransformBody(AdminConfirmProductChange)],
    policies: [
      {
        resource: PolicyResource.product_change,
        operation: PolicyOperation.update,
      },
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/product-changes/:id/cancel",
    middlewares: [validateAndTransformBody(AdminCancelProductChange)],
    policies: [
      {
        resource: PolicyResource.product_change,
        operation: PolicyOperation.update,
      },
    ],
  },
]

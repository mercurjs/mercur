import { MiddlewareRoute } from "@medusajs/framework/http"
import { validateAndTransformBody } from "@medusajs/framework"
import { createLinkBody } from "@medusajs/medusa/api/utils/validators"

import { requirePermission } from "../../utils"

export const adminRegionsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["POST"],
    matcher: "/admin/regions/:id/sellers",
    middlewares: [
      requirePermission("regions", "edit"),
      validateAndTransformBody(createLinkBody()),
    ],
  },
]

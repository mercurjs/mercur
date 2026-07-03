import { MiddlewareRoute } from "@medusajs/framework/http"
import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"

import { ORIGINAL_MIDDLEWARES } from "../../../utils/disable-medusa-middlewares"
import { adminCollectionQueryConfig } from "./query-config"
import {
  AdminCollectionParams,
  AdminCollectionsParams,
  AdminCreateCollection,
  AdminUpdateCollection,
} from "./validators"

const OVERRIDDEN_MATCHERS = new Set(["/admin/collections", "/admin/collections/:id"])

const capturedBase = (ORIGINAL_MIDDLEWARES[
  "dist/api/admin/collections/middlewares.js"
] ?? []) as MiddlewareRoute[]

const baseRetained = capturedBase.filter(
  (route) => !OVERRIDDEN_MATCHERS.has(String(route.matcher))
)

export const adminCollectionsMiddlewares: MiddlewareRoute[] = [
  ...baseRetained,
  {
    method: ["GET"],
    matcher: "/admin/collections",
    middlewares: [
      validateAndTransformQuery(
        AdminCollectionsParams,
        adminCollectionQueryConfig.list
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/collections",
    middlewares: [
      validateAndTransformBody(AdminCreateCollection),
      validateAndTransformQuery(
        AdminCollectionParams,
        adminCollectionQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/collections/:id",
    middlewares: [
      validateAndTransformQuery(
        AdminCollectionParams,
        adminCollectionQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/collections/:id",
    middlewares: [
      validateAndTransformBody(AdminUpdateCollection),
      validateAndTransformQuery(
        AdminCollectionParams,
        adminCollectionQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/admin/collections/:id",
    middlewares: [],
  },
]

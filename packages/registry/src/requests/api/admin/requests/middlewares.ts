import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"
import { MiddlewareRoute } from "@medusajs/medusa"

import { adminRequestQueryConfig } from "./query-config"
import { AdminGetRequestsParams, AdminReviewNote } from "./validators"
import { applyRequestCustomFieldsFilter, excludePendingRequestEntities } from "./helpers"

export const adminRequestsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/product-categories",
    middlewares: [excludePendingRequestEntities("product_category")],
  },
  {
    method: ["GET"],
    matcher: "/admin/collections",
    middlewares: [excludePendingRequestEntities("product_collection")],
  },
  {
    method: ["GET"],
    matcher: "/admin/product-tags",
    middlewares: [excludePendingRequestEntities("product_tag")],
  },
  {
    method: ["GET"],
    matcher: "/admin/product-types",
    middlewares: [excludePendingRequestEntities("product_type")],
  },
  {
    method: ["GET"],
    matcher: "/admin/requests/:type",
    middlewares: [
      validateAndTransformQuery(
        AdminGetRequestsParams,
        adminRequestQueryConfig.list
      ),
      applyRequestCustomFieldsFilter(),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/requests/:type/:id",
    middlewares: [
      validateAndTransformQuery(
        AdminGetRequestsParams,
        adminRequestQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/requests/:type/:id/accept",
    middlewares: [
      validateAndTransformBody(AdminReviewNote),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/requests/:type/:id/reject",
    middlewares: [
      validateAndTransformBody(AdminReviewNote),
    ],
  },
]

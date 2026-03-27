import { MiddlewareRoute } from "@medusajs/framework/http"
import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"

import * as QueryConfig from "./query-config"
import {
  AdminCreateAttribute,
  AdminCreateAttributeValue,
  AdminGetAttributeParams,
  AdminGetAttributeValueParams,
  AdminGetAttributeValuesParams,
  AdminGetAttributesParams,
  AdminUpdateAttribute,
  AdminUpdateAttributeValue,
} from "./validators"

export const adminAttributeMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/attributes",
    middlewares: [
      validateAndTransformQuery(
        AdminGetAttributesParams,
        QueryConfig.listAttributeQueryConfig
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/attributes",
    middlewares: [
      validateAndTransformBody(AdminCreateAttribute),
      validateAndTransformQuery(
        AdminGetAttributeParams,
        QueryConfig.retrieveAttributeQueryConfig
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/attributes/:id",
    middlewares: [
      validateAndTransformQuery(
        AdminGetAttributeParams,
        QueryConfig.retrieveAttributeQueryConfig
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/attributes/:id",
    middlewares: [
      validateAndTransformBody(AdminUpdateAttribute),
      validateAndTransformQuery(
        AdminGetAttributeParams,
        QueryConfig.retrieveAttributeQueryConfig
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/attributes/:id/values",
    middlewares: [
      validateAndTransformQuery(
        AdminGetAttributeValuesParams,
        QueryConfig.listAttributeValueQueryConfig
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/attributes/:id/values",
    middlewares: [
      validateAndTransformBody(AdminCreateAttributeValue),
      validateAndTransformQuery(
        AdminGetAttributeValueParams,
        QueryConfig.retrieveAttributeValueQueryConfig
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/attributes/:id/values/:value_id",
    middlewares: [
      validateAndTransformQuery(
        AdminGetAttributeValueParams,
        QueryConfig.retrieveAttributeValueQueryConfig
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/attributes/:id/values/:value_id",
    middlewares: [
      validateAndTransformBody(AdminUpdateAttributeValue),
      validateAndTransformQuery(
        AdminGetAttributeValueParams,
        QueryConfig.retrieveAttributeValueQueryConfig
      ),
    ],
  },
]

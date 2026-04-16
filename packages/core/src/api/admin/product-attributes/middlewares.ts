import { MiddlewareRoute } from "@medusajs/framework/http"
import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"

import { adminProductAttributeQueryConfig } from "./query-config"
import {
  AdminCreateProductAttribute,
  AdminCreateProductAttributeValue,
  AdminGetProductAttributeParams,
  AdminGetProductAttributesParams,
  AdminUpdateProductAttribute,
  AdminUpdateProductAttributeValue,
} from "./validators"

export const adminProductAttributesMiddlewares: MiddlewareRoute[] = [
  // --- /admin/product-attributes ---
  {
    method: ["GET"],
    matcher: "/admin/product-attributes",
    middlewares: [
      validateAndTransformQuery(
        AdminGetProductAttributesParams,
        adminProductAttributeQueryConfig.list
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/product-attributes",
    middlewares: [
      validateAndTransformBody(AdminCreateProductAttribute),
      validateAndTransformQuery(
        AdminGetProductAttributeParams,
        adminProductAttributeQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/product-attributes/:id",
    middlewares: [
      validateAndTransformQuery(
        AdminGetProductAttributeParams,
        adminProductAttributeQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/product-attributes/:id",
    middlewares: [
      validateAndTransformBody(AdminUpdateProductAttribute),
      validateAndTransformQuery(
        AdminGetProductAttributeParams,
        adminProductAttributeQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/admin/product-attributes/:id",
    middlewares: [],
  },

  // --- /admin/product-attributes/:id/values ---
  {
    method: ["POST"],
    matcher: "/admin/product-attributes/:id/values",
    middlewares: [
      validateAndTransformBody(AdminCreateProductAttributeValue),
      validateAndTransformQuery(
        AdminGetProductAttributeParams,
        adminProductAttributeQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/product-attributes/:id/values/:value_id",
    middlewares: [
      validateAndTransformBody(AdminUpdateProductAttributeValue),
      validateAndTransformQuery(
        AdminGetProductAttributeParams,
        adminProductAttributeQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/admin/product-attributes/:id/values/:value_id",
    middlewares: [],
  },
]

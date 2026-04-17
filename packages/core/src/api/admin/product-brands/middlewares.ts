import { MiddlewareRoute } from "@medusajs/framework/http"
import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"

import { adminProductBrandQueryConfig } from "./query-config"
import {
  AdminCreateProductBrand,
  AdminGetProductBrandParams,
  AdminGetProductBrandsParams,
  AdminUpdateProductBrand,
} from "./validators"

export const adminProductBrandsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/product-brands",
    middlewares: [
      validateAndTransformQuery(
        AdminGetProductBrandsParams,
        adminProductBrandQueryConfig.list
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/product-brands",
    middlewares: [
      validateAndTransformBody(AdminCreateProductBrand),
      validateAndTransformQuery(
        AdminGetProductBrandParams,
        adminProductBrandQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/product-brands/:id",
    middlewares: [
      validateAndTransformQuery(
        AdminGetProductBrandParams,
        adminProductBrandQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/product-brands/:id",
    middlewares: [
      validateAndTransformBody(AdminUpdateProductBrand),
      validateAndTransformQuery(
        AdminGetProductBrandParams,
        adminProductBrandQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/admin/product-brands/:id",
    middlewares: [],
  },
]

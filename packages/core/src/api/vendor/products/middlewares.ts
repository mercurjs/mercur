import {
  MiddlewareRoute,
} from "@medusajs/framework/http"
import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"

import { vendorProductQueryConfig } from "./query-config"
import {
  VendorCreateProduct,
  VendorGetProductParams,
  VendorGetProductsParams,
  VendorUpdateProduct,
} from "./validators"

export const vendorProductsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/products",
    middlewares: [
      validateAndTransformQuery(
        VendorGetProductsParams,
        vendorProductQueryConfig.list
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/products",
    middlewares: [
      validateAndTransformBody(VendorCreateProduct),
      validateAndTransformQuery(
        VendorGetProductParams,
        vendorProductQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/products/:id",
    middlewares: [
      validateAndTransformQuery(
        VendorGetProductParams,
        vendorProductQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/products/:id",
    middlewares: [
      validateAndTransformBody(VendorUpdateProduct),
      validateAndTransformQuery(
        VendorGetProductParams,
        vendorProductQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/vendor/products/:id",
    middlewares: [],
  },
]

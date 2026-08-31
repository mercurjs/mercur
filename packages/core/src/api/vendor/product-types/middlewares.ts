import { PolicyResource } from "../../utils/policy-resources"
import { PolicyOperation } from "@medusajs/framework/utils"
import { MiddlewareRoute } from "@medusajs/framework/http"
import { validateAndTransformQuery } from "@medusajs/framework"

import { vendorProductTypeQueryConfig } from "./query-config"
import {
  VendorGetProductTypeParams,
  VendorGetProductTypesParams,
} from "./validators"

export const vendorProductTypesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/product-types",
    middlewares: [
      validateAndTransformQuery(
        VendorGetProductTypesParams,
        vendorProductTypeQueryConfig.list
      ),
    ],
    policies: [
      {
        resource: PolicyResource.product_type,
        operation: PolicyOperation.read,
      },
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/product-types/:id",
    middlewares: [
      validateAndTransformQuery(
        VendorGetProductTypeParams,
        vendorProductTypeQueryConfig.retrieve
      ),
    ],
    policies: [
      {
        resource: PolicyResource.product_type,
        operation: PolicyOperation.read,
      },
    ],
  },
]

import { MiddlewareRoute } from "@medusajs/framework/http"
import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"

import { listTransformQueryConfig, retrieveTransformQueryConfig } from "./query-config"
import {
  VendorCreateProductCategoryRequest,
  VendorGetProductCategoryRequestsParams,
} from "./validators"
import { applyRequestCustomFieldsFilter } from "./helpers"

export const vendorProductCategoryRequestsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/product-categories",
    middlewares: [
      validateAndTransformQuery(
        VendorGetProductCategoryRequestsParams,
        listTransformQueryConfig
      ),
      applyRequestCustomFieldsFilter(),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/product-categories",
    middlewares: [
      validateAndTransformBody(VendorCreateProductCategoryRequest),
      validateAndTransformQuery(
        VendorGetProductCategoryRequestsParams,
        retrieveTransformQueryConfig
      ),
    ],
  },
]

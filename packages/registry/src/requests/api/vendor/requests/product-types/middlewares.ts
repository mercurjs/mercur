import { MiddlewareRoute } from "@medusajs/framework/http"
import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"

import { listTransformQueryConfig, retrieveTransformQueryConfig } from "./query-config"
import {
  VendorCreateProductTypeRequest,
  VendorGetProductTypeRequestsParams,
} from "./validators"
import { applyRequestCustomFieldsFilter } from "./helpers"

export const vendorProductTypeRequestsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/requests/product-types",
    middlewares: [
      validateAndTransformQuery(
        VendorGetProductTypeRequestsParams,
        listTransformQueryConfig
      ),
      applyRequestCustomFieldsFilter(),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/requests/product-types",
    middlewares: [
      validateAndTransformBody(VendorCreateProductTypeRequest),
      validateAndTransformQuery(
        VendorGetProductTypeRequestsParams,
        retrieveTransformQueryConfig
      ),
    ],
  },
]

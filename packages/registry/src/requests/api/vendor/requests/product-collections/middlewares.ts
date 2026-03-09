import { MiddlewareRoute } from "@medusajs/framework/http"
import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"

import { listTransformQueryConfig, retrieveTransformQueryConfig } from "./query-config"
import {
  VendorCreateProductCollectionRequest,
  VendorGetProductCollectionRequestsParams,
} from "./validators"
import { applyRequestCustomFieldsFilter } from "./helpers"

export const vendorProductCollectionRequestsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/requests/product-collections",
    middlewares: [
      validateAndTransformQuery(
        VendorGetProductCollectionRequestsParams,
        listTransformQueryConfig
      ),
      applyRequestCustomFieldsFilter(),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/requests/product-collections",
    middlewares: [
      validateAndTransformBody(VendorCreateProductCollectionRequest),
      validateAndTransformQuery(
        VendorGetProductCollectionRequestsParams,
        retrieveTransformQueryConfig
      ),
    ],
  },
]

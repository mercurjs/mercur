import { MiddlewareRoute } from "@medusajs/framework/http"
import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"

import { listTransformQueryConfig, retrieveTransformQueryConfig } from "./query-config"
import {
  VendorCreateProductTagRequest,
  VendorGetProductTagRequestsParams,
} from "./validators"
import { applyRequestCustomFieldsFilter } from "./helpers"

export const vendorProductTagRequestsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/requests/product-tags",
    middlewares: [
      validateAndTransformQuery(
        VendorGetProductTagRequestsParams,
        listTransformQueryConfig
      ),
      applyRequestCustomFieldsFilter(),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/requests/product-tags",
    middlewares: [
      validateAndTransformBody(VendorCreateProductTagRequest),
      validateAndTransformQuery(
        VendorGetProductTagRequestsParams,
        retrieveTransformQueryConfig
      ),
    ],
  },
]

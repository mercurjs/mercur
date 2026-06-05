import { MiddlewareRoute } from "@medusajs/framework/http"
import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"
import { createLinkBody } from "@medusajs/medusa/api/utils/validators"

import {
  listTransformQueryConfig,
  retrieveTransformQueryConfig,
} from "./query-config"
import {
  VendorGetSalesChannelParams,
  VendorGetSalesChannelsParams,
} from "./validators"

export const vendorSalesChannelsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/sales-channels",
    middlewares: [
      validateAndTransformQuery(
        VendorGetSalesChannelsParams,
        listTransformQueryConfig
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/sales-channels/:id",
    middlewares: [
      validateAndTransformQuery(
        VendorGetSalesChannelParams,
        retrieveTransformQueryConfig
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/sales-channels/:id/products",
    middlewares: [
      validateAndTransformBody(createLinkBody()),
      validateAndTransformQuery(
        VendorGetSalesChannelParams,
        retrieveTransformQueryConfig
      ),
    ],
  },
]

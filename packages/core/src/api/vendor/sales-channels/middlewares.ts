import { PolicyResource } from "../../utils/policy-resources"
import { PolicyOperation } from "@medusajs/framework/utils"
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
    policies: [
      {
        resource: PolicyResource.sales_channel,
        operation: PolicyOperation.read,
      },
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
    policies: [
      {
        resource: PolicyResource.sales_channel,
        operation: PolicyOperation.read,
      },
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
    policies: [
      {
        resource: PolicyResource.sales_channel,
        operation: PolicyOperation.update,
      },
    ],
  },
]

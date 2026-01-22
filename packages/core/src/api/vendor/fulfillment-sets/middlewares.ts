import { MiddlewareRoute } from "@medusajs/framework/http"
import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"

import {
  vendorFulfillmentSetQueryConfig,
  vendorServiceZoneQueryConfig,
} from "./query-config"
import {
  VendorCreateServiceZone,
  VendorFulfillmentSetParams,
  VendorServiceZoneParams,
  VendorUpdateServiceZone,
} from "./validators"

export const vendorFulfillmentSetsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["DELETE"],
    matcher: "/vendor/fulfillment-sets/:id",
    middlewares: [],
  },
  {
    method: ["POST"],
    matcher: "/vendor/fulfillment-sets/:id/service-zones",
    middlewares: [
      validateAndTransformBody(VendorCreateServiceZone),
      validateAndTransformQuery(
        VendorFulfillmentSetParams,
        vendorFulfillmentSetQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/fulfillment-sets/:id/service-zones/:zone_id",
    middlewares: [
      validateAndTransformQuery(
        VendorServiceZoneParams,
        vendorServiceZoneQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/fulfillment-sets/:id/service-zones/:zone_id",
    middlewares: [
      validateAndTransformBody(VendorUpdateServiceZone),
      validateAndTransformQuery(
        VendorFulfillmentSetParams,
        vendorFulfillmentSetQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/vendor/fulfillment-sets/:id/service-zones/:zone_id",
    middlewares: [
      validateAndTransformQuery(
        VendorFulfillmentSetParams,
        vendorFulfillmentSetQueryConfig.retrieve
      ),
    ],
  },
]

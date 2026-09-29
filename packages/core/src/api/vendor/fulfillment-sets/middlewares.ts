import { requirePermission } from "../../utils"
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
    middlewares: [
      requirePermission("shipping", "manage"),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/fulfillment-sets/:id/service-zones",
    middlewares: [
      requirePermission("shipping", "edit"),
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
      requirePermission("shipping", "view"),
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
      requirePermission("shipping", "edit"),
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
      requirePermission("shipping", "manage"),
      validateAndTransformQuery(
        VendorFulfillmentSetParams,
        vendorFulfillmentSetQueryConfig.retrieve
      ),
    ],
  },
]

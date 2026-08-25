import { PolicyResource } from "../../utils/policy-resources"
import { PolicyOperation } from "@medusajs/framework/utils"
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
    policies: [
      {
        resource: PolicyResource.fulfillment_set,
        operation: PolicyOperation.delete,
      },
    ],
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
    policies: [
      {
        resource: PolicyResource.fulfillment_set,
        operation: PolicyOperation.update,
      },
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
    policies: [
      {
        resource: PolicyResource.fulfillment_set,
        operation: PolicyOperation.read,
      },
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
    policies: [
      {
        resource: PolicyResource.fulfillment_set,
        operation: PolicyOperation.update,
      },
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
    policies: [
      {
        resource: PolicyResource.fulfillment_set,
        operation: PolicyOperation.delete,
      },
    ],
  },
]

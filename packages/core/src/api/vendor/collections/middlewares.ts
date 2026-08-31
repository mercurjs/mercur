import { PolicyResource } from "../../utils/policy-resources"
import { PolicyOperation } from "@medusajs/framework/utils"
import { MiddlewareRoute } from "@medusajs/framework/http"
import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"

import {
  listTransformQueryConfig,
  retrieveTransformQueryConfig,
} from "./query-config"
import {
  VendorGetCollectionParams,
  VendorGetCollectionsParams,
} from "./validators"
import { createLinkBody } from "@medusajs/medusa/api/utils/validators"

export const vendorCollectionsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/collections",
    middlewares: [
      validateAndTransformQuery(
        VendorGetCollectionsParams,
        listTransformQueryConfig
      ),
    ],
    policies: [
      {
        resource: PolicyResource.product_collection,
        operation: PolicyOperation.read,
      },
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/collections/:id",
    middlewares: [
      validateAndTransformQuery(
        VendorGetCollectionParams,
        retrieveTransformQueryConfig
      ),
    ],
    policies: [
      {
        resource: PolicyResource.product_collection,
        operation: PolicyOperation.read,
      },
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/collections/:id/products",
    middlewares: [
      validateAndTransformBody(createLinkBody()),
      validateAndTransformQuery(
        VendorGetCollectionParams,
        retrieveTransformQueryConfig
      ),
    ],
    policies: [
      {
        resource: PolicyResource.product_collection,
        operation: PolicyOperation.update,
      },
    ],
  },
]

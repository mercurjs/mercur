import { requirePermission } from "../../utils"
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
      requirePermission("product_collections", "view"),
      validateAndTransformQuery(
        VendorGetCollectionsParams,
        listTransformQueryConfig
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/collections/:id",
    middlewares: [
      requirePermission("product_collections", "view"),
      validateAndTransformQuery(
        VendorGetCollectionParams,
        retrieveTransformQueryConfig
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/collections/:id/products",
    middlewares: [
      requirePermission("product_collections", "edit"),
      validateAndTransformBody(createLinkBody()),
      validateAndTransformQuery(
        VendorGetCollectionParams,
        retrieveTransformQueryConfig
      ),
    ],
  },
]

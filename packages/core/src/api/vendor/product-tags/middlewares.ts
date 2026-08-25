import { PolicyResource } from "../../utils/policy-resources"
import { PolicyOperation } from "@medusajs/framework/utils"
import { MiddlewareRoute } from "@medusajs/framework/http"
import { validateAndTransformQuery } from "@medusajs/framework"

import { vendorProductTagsQueryConfig } from "./query-config"
import {
  VendorGetProductTagParams,
  VendorGetProductTagsParams,
} from "./validators"

export const vendorProductTagsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/product-tags",
    middlewares: [
      validateAndTransformQuery(
        VendorGetProductTagsParams,
        vendorProductTagsQueryConfig.list
      ),
    ],
    policies: [
      {
        resource: PolicyResource.product_tag,
        operation: PolicyOperation.read,
      },
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/product-tags/:id",
    middlewares: [
      validateAndTransformQuery(
        VendorGetProductTagParams,
        vendorProductTagsQueryConfig.retrieve
      ),
    ],
    policies: [
      {
        resource: PolicyResource.product_tag,
        operation: PolicyOperation.read,
      },
    ],
  },
]

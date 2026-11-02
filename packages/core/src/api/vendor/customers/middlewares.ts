import { applySellerLinkFilter, requirePermission } from "../../utils"
import {
  MiddlewareRoute,
} from "@medusajs/framework/http"
import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"

import { vendorCustomerQueryConfig } from "./query-config"
import {
  VendorGetCustomerParams,
  VendorGetCustomersParams,
  VendorManageCustomerCustomerGroups,
} from "./validators"

const applySellerCustomerLinkFilter = applySellerLinkFilter(["sellers"])

export const vendorCustomersMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/customers",
    middlewares: [
      requirePermission("customers", "view"),
      validateAndTransformQuery(
        VendorGetCustomersParams,
        vendorCustomerQueryConfig.list
      ),
      applySellerCustomerLinkFilter,
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/customers/:id",
    middlewares: [
      requirePermission("customers", "view"),
      validateAndTransformQuery(
        VendorGetCustomerParams,
        vendorCustomerQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/customers/:id/customer-groups",
    middlewares: [
      requirePermission("customers", "edit"),
      validateAndTransformBody(VendorManageCustomerCustomerGroups),
      validateAndTransformQuery(
        VendorGetCustomerParams,
        vendorCustomerQueryConfig.retrieve
      ),
    ],
  },
]

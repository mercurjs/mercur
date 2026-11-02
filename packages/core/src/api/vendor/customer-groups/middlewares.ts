import { applySellerLinkFilter, requirePermission } from "../../utils"
import {
  MiddlewareRoute,
} from "@medusajs/framework/http"
import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"

import { vendorCustomerGroupQueryConfig } from "./query-config"
import {
  VendorCreateCustomerGroup,
  VendorGetCustomerGroupParams,
  VendorGetCustomerGroupsParams,
  VendorManageCustomerGroupCustomers,
  VendorUpdateCustomerGroup,
} from "./validators"

const applySellerCustomerGroupLinkFilter = applySellerLinkFilter()

export const vendorCustomerGroupsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/customer-groups",
    middlewares: [
      requirePermission("customer_groups", "view"),
      validateAndTransformQuery(
        VendorGetCustomerGroupsParams,
        vendorCustomerGroupQueryConfig.list
      ),
      applySellerCustomerGroupLinkFilter,
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/customer-groups",
    middlewares: [
      requirePermission("customer_groups", "edit"),
      validateAndTransformBody(VendorCreateCustomerGroup),
      validateAndTransformQuery(
        VendorGetCustomerGroupParams,
        vendorCustomerGroupQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/customer-groups/:id",
    middlewares: [
      requirePermission("customer_groups", "view"),
      validateAndTransformQuery(
        VendorGetCustomerGroupParams,
        vendorCustomerGroupQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/customer-groups/:id",
    middlewares: [
      requirePermission("customer_groups", "edit"),
      validateAndTransformBody(VendorUpdateCustomerGroup),
      validateAndTransformQuery(
        VendorGetCustomerGroupParams,
        vendorCustomerGroupQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/vendor/customer-groups/:id",
    middlewares: [
      requirePermission("customer_groups", "manage"),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/customer-groups/:id/customers",
    middlewares: [
      requirePermission("customer_groups", "edit"),
      validateAndTransformBody(VendorManageCustomerGroupCustomers),
      validateAndTransformQuery(
        VendorGetCustomerGroupParams,
        vendorCustomerGroupQueryConfig.retrieve
      ),
    ],
  },
]

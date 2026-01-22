import {
  AuthenticatedMedusaRequest,
  maybeApplyLinkFilter,
  MedusaNextFunction,
  MedusaResponse,
  MiddlewareRoute,
} from "@medusajs/framework/http"
import { validateAndTransformQuery } from "@medusajs/framework"

import { vendorCustomerQueryConfig } from "./query-config"
import { VendorGetCustomerParams, VendorGetCustomersParams } from "./validators"

const applySellerCustomerLinkFilter = (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  req.filterableFields.seller_id = req.auth_context.actor_id

  return maybeApplyLinkFilter({
    entryPoint: "seller_customer",
    resourceId: "customer_id",
    filterableField: "seller_id",
  })(req, res, next)
}

export const vendorCustomersMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/customers",
    middlewares: [
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
      validateAndTransformQuery(
        VendorGetCustomerParams,
        vendorCustomerQueryConfig.retrieve
      ),
    ],
  },
]

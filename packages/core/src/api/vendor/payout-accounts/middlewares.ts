import {
  AuthenticatedMedusaRequest,
  maybeApplyLinkFilter,
  MedusaNextFunction,
  MedusaResponse,
  MiddlewareRoute,
} from "@medusajs/framework/http"
import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"

import { vendorPayoutAccountQueryConfig } from "./query-config"
import {
  VendorCreatePayoutAccount,
  VendorGetPayoutAccountParams,
  VendorGetPayoutAccountsParams,
} from "./validators"

const applySellerPayoutAccountLinkFilter = (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  req.filterableFields.seller_id = req.auth_context.actor_id

  return maybeApplyLinkFilter({
    entryPoint: "seller_payout_account",
    resourceId: "payout_account_id",
    filterableField: "seller_id",
  })(req, res, next)
}

export const vendorPayoutAccountsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/payout-accounts",
    middlewares: [
      validateAndTransformQuery(
        VendorGetPayoutAccountsParams,
        vendorPayoutAccountQueryConfig.list
      ),
      applySellerPayoutAccountLinkFilter,
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/payout-accounts",
    middlewares: [
      validateAndTransformBody(VendorCreatePayoutAccount),
      validateAndTransformQuery(
        VendorGetPayoutAccountParams,
        vendorPayoutAccountQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/payout-accounts/:id",
    middlewares: [
      validateAndTransformQuery(
        VendorGetPayoutAccountParams,
        vendorPayoutAccountQueryConfig.retrieve
      ),
    ],
  },
]

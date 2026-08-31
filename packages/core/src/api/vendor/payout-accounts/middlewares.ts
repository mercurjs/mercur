import { PolicyResource } from "../../utils/policy-resources"
import { PolicyOperation } from "@medusajs/framework/utils"
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

import {
  vendorPayoutAccountQueryConfig,
  vendorOnboardingQueryConfig,
} from "./query-config"
import {
  VendorCreateOnboarding,
  VendorCreatePayoutAccount,
  VendorGetPayoutAccountParams,
  VendorGetPayoutAccountsParams,
} from "./validators"

const applySellerPayoutAccountLinkFilter = (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  req.filterableFields.seller_id = req.seller_context!.seller_id

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
    policies: [
      {
        resource: PolicyResource.payout_account,
        operation: PolicyOperation.read,
      },
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
    policies: [
      {
        resource: PolicyResource.payout_account,
        operation: PolicyOperation.create,
      },
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
    policies: [
      {
        resource: PolicyResource.payout_account,
        operation: PolicyOperation.read,
      },
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/payout-accounts/:id/onboarding",
    middlewares: [
      validateAndTransformBody(VendorCreateOnboarding),
      validateAndTransformQuery(
        VendorGetPayoutAccountParams,
        vendorOnboardingQueryConfig.retrieve
      ),
    ],
    policies: [
      {
        resource: PolicyResource.payout_account,
        operation: PolicyOperation.update,
      },
    ],
  },
]
